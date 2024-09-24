// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20Upgradeable as IERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {IERC20MetadataUpgradeable as IERC20Metadata} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import "./interfaces/IRedemptionVault.sol";
import "./interfaces/IMTbill.sol";
import "./interfaces/IDataFeed.sol";

import "./abstract/ManageableVault.sol";

import "./access/Greenlistable.sol";

/**
 * @title RedemptionVault
 * @notice Smart contract that handles mTBILL redemptions
 * @author RedDuck Software
 */
contract RedemptionVault is ManageableVault, IRedemptionVault {
    using Counters for Counters.Counter;

    /**
     * @notice min amount for fiat requests
     */
    uint256 public minFiatRedeemAmount;

    /**
     * @notice fee percent for fiat requests
     */
    uint256 public fiatAdditionalFee;

    /**
     * @notice static fee in mToken for fiat requests
     */
    uint256 public fiatFlatFee;

    /**
     * @notice mapping, requestId to request data
     */
    mapping(uint256 => Request) public redeemRequests;

    /**
     * @notice address is designated for standard redemptions, allowing tokens to be pulled from this address
     */
    address public requestRedeemer;

    /**
     * @dev leaving a storage gap for futures updates
     */
    uint256[50] private __gap;

    /**
     * @notice upgradeable pattern contract`s initializer
     * @param _ac address of MidasAccessControll contract
     * @param _mTokenInitParams init params for mToken
     * @param _receiversInitParams init params for receivers
     * @param _instantInitParams init params for instant operations
     * @param _sanctionsList address of sanctionsList contract
     * @param _variationTolerance percent of prices diviation 1% = 100
     * @param _minAmount basic min amount for operations
     * @param _fiatRedemptionInitParams params fiatAdditionalFee, fiatFlatFee, minFiatRedeemAmount
     * @param _requestRedeemer address is designated for standard redemptions, allowing tokens to be pulled from this address
     */
    function initialize(
        address _ac,
        MTokenInitParams calldata _mTokenInitParams,
        ReceiversInitParams calldata _receiversInitParams,
        InstantInitParams calldata _instantInitParams,
        address _sanctionsList,
        uint256 _variationTolerance,
        uint256 _minAmount,
        FiatRedeptionInitParams calldata _fiatRedemptionInitParams,
        address _requestRedeemer
    ) external initializer {
        __RedemptionVault_init(
            _ac,
            _mTokenInitParams,
            _receiversInitParams,
            _instantInitParams,
            _sanctionsList,
            _variationTolerance,
            _minAmount,
            _fiatRedemptionInitParams,
            _requestRedeemer
        );
    }

    // solhint-disable func-name-mixedcase
    function __RedemptionVault_init(
        address _ac,
        MTokenInitParams calldata _mTokenInitParams,
        ReceiversInitParams calldata _receiversInitParams,
        InstantInitParams calldata _instantInitParams,
        address _sanctionsList,
        uint256 _variationTolerance,
        uint256 _minAmount,
        FiatRedeptionInitParams calldata _fiatRedemptionInitParams,
        address _requestRedeemer
    ) internal onlyInitializing {
        __ManageableVault_init(
            _ac,
            _mTokenInitParams,
            _receiversInitParams,
            _instantInitParams,
            _sanctionsList,
            _variationTolerance,
            _minAmount
        );
        _validateFee(_fiatRedemptionInitParams.fiatAdditionalFee, false);
        _validateAddress(_requestRedeemer, false);

        minFiatRedeemAmount = _fiatRedemptionInitParams.minFiatRedeemAmount;
        fiatAdditionalFee = _fiatRedemptionInitParams.fiatAdditionalFee;
        fiatFlatFee = _fiatRedemptionInitParams.fiatFlatFee;
        requestRedeemer = _requestRedeemer;
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function redeemInstant(
        address tokenOut,
        uint256 amountMTokenIn,
        uint256 minReceiveAmount
    )
        external
        virtual
        whenFnNotPaused(this.redeemInstant.selector)
        onlyGreenlisted(msg.sender)
        onlyNotBlacklisted(msg.sender)
        onlyNotSanctioned(msg.sender)
    {
        address user = msg.sender;

        (
            uint256 feeAmount,
            uint256 amountMTokenWithoutFee
        ) = _calcAndValidateRedeem(user, tokenOut, amountMTokenIn, true, false);

        _requireAndUpdateLimit(amountMTokenIn);

        uint256 tokenDecimals = _tokenDecimals(tokenOut);

        uint256 amountMTokenInCopy = amountMTokenIn;
        address tokenOutCopy = tokenOut;
        uint256 minReceiveAmountCopy = minReceiveAmount;

        (uint256 amountMTokenInUsd, uint256 mTokenRate) = _convertMTokenToUsd(
            amountMTokenInCopy
        );
        (uint256 amountTokenOut, uint256 tokenOutRate) = _convertUsdToToken(
            amountMTokenInUsd,
            tokenOutCopy
        );

        uint256 amountTokenOutWithoutFee = _truncate(
            (amountMTokenWithoutFee * mTokenRate) / tokenOutRate,
            tokenDecimals
        );

        require(
            amountTokenOutWithoutFee >= minReceiveAmountCopy,
            "RV: minReceiveAmount > actual"
        );

        _requireAndUpdateAllowance(tokenOutCopy, amountTokenOut);

        mToken.burn(user, amountMTokenWithoutFee);
        if (feeAmount > 0)
            _tokenTransferFromUser(address(mToken), feeReceiver, feeAmount, 18);

        _tokenTransferToUser(
            tokenOutCopy,
            user,
            amountTokenOutWithoutFee,
            tokenDecimals
        );

        emit RedeemInstant(
            user,
            tokenOutCopy,
            amountMTokenInCopy,
            feeAmount,
            amountTokenOutWithoutFee
        );
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function redeemRequest(address tokenOut, uint256 amountMTokenIn)
        external
        whenFnNotPaused(this.redeemRequest.selector)
        onlyGreenlisted(msg.sender)
        onlyNotBlacklisted(msg.sender)
        onlyNotSanctioned(msg.sender)
        returns (uint256 requestId)
    {
        require(tokenOut != MANUAL_FULLFILMENT_TOKEN, "RV: tokenOut == fiat");
        return _redeemRequest(tokenOut, amountMTokenIn);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function redeemFiatRequest(uint256 amountMTokenIn)
        external
        whenFnNotPaused(this.redeemFiatRequest.selector)
        onlyAlwaysGreenlisted(msg.sender)
        onlyNotBlacklisted(msg.sender)
        onlyNotSanctioned(msg.sender)
        returns (uint256 requestId)
    {
        return _redeemRequest(MANUAL_FULLFILMENT_TOKEN, amountMTokenIn);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function approveRequest(uint256 requestId, uint256 newMTokenRate)
        external
        onlyVaultAdmin
    {
        _approveRequest(requestId, newMTokenRate, false);

        emit ApproveRequest(requestId, newMTokenRate);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function safeApproveRequest(uint256 requestId, uint256 newMTokenRate)
        external
        onlyVaultAdmin
    {
        _approveRequest(requestId, newMTokenRate, true);

        emit SafeApproveRequest(requestId, newMTokenRate);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function rejectRequest(uint256 requestId) external onlyVaultAdmin {
        Request memory request = redeemRequests[requestId];

        _validateRequest(request.sender, request.status);

        redeemRequests[requestId].status = RequestStatus.Canceled;

        emit RejectRequest(requestId, request.sender);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function setMinFiatRedeemAmount(uint256 newValue) external onlyVaultAdmin {
        minFiatRedeemAmount = newValue;

        emit SetMinFiatRedeemAmount(msg.sender, newValue);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function setFiatFlatFee(uint256 feeInMToken) external onlyVaultAdmin {
        fiatFlatFee = feeInMToken;

        emit SetFiatFlatFee(msg.sender, feeInMToken);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function setFiatAdditionalFee(uint256 newFee) external onlyVaultAdmin {
        _validateFee(newFee, false);

        fiatAdditionalFee = newFee;

        emit SetFiatAdditionalFee(msg.sender, newFee);
    }

    /**
     * @inheritdoc IRedemptionVault
     */
    function setRequestRedeemer(address redeemer) external onlyVaultAdmin {
        _validateAddress(redeemer, false);

        requestRedeemer = redeemer;

        emit SetRequestRedeemer(msg.sender, redeemer);
    }

    /**
     * @inheritdoc ManageableVault
     */
    function vaultRole() public pure virtual override returns (bytes32) {
        return REDEMPTION_VAULT_ADMIN_ROLE;
    }

    /**
     * @notice validates approve
     * burns amount from contract
     * transfer tokenOut to user if not fiat
     * sets flag Processed
     * @param requestId request id
     * @param newMTokenRate new mToken rate
     * @param isSafe new mToken rate
     */
    function _approveRequest(
        uint256 requestId,
        uint256 newMTokenRate,
        bool isSafe
    ) internal {
        Request memory request = redeemRequests[requestId];

        _validateRequest(request.sender, request.status);

        if (isSafe) {
            _requireVariationTolerance(request.mTokenRate, newMTokenRate);
        }

        mToken.burn(address(this), request.amountMToken);

        bool isFiat = request.tokenOut == MANUAL_FULLFILMENT_TOKEN;

        uint256 tokenDecimals = isFiat ? 18 : _tokenDecimals(request.tokenOut);

        uint256 amountTokenOutWithoutFee = _truncate(
            (request.amountMToken * newMTokenRate) / request.tokenOutRate,
            tokenDecimals
        );

        _requireAndUpdateAllowance(request.tokenOut, amountTokenOutWithoutFee);

        if (!isFiat) {
            _tokenTransferFromTo(
                request.tokenOut,
                requestRedeemer,
                request.sender,
                amountTokenOutWithoutFee,
                tokenDecimals
            );
        }

        request.status = RequestStatus.Processed;
        request.mTokenRate = newMTokenRate;
        redeemRequests[requestId] = request;
    }

    /**
     * @notice validates request
     * if exist
     * if not processed
     * @param sender sender address
     * @param status request status
     */
    function _validateRequest(address sender, RequestStatus status)
        internal
        pure
    {
        require(sender != address(0), "RV: request not exist");
        require(status == RequestStatus.Pending, "RV: request not pending");
    }

    /**
     * @notice Creating request depends on tokenOut
     * @param tokenOut tokenOut address
     * @param amountMTokenIn amount of mToken (decimals 18)
     *
     * @return requestId request id
     */
    function _redeemRequest(address tokenOut, uint256 amountMTokenIn)
        internal
        returns (uint256)
    {
        address user = msg.sender;

        bool isFiat = tokenOut == MANUAL_FULLFILMENT_TOKEN;

        (
            uint256 feeAmount,
            uint256 amountMTokenWithoutFee
        ) = _calcAndValidateRedeem(
                user,
                tokenOut,
                amountMTokenIn,
                false,
                isFiat
            );

        address tokenOutCopy = tokenOut;

        // assigning the default value which is gonna be used
        // only for fiat redemptions
        uint256 tokenOutRate = 1e18;

        if (!isFiat) {
            TokenConfig storage config = tokensConfig[tokenOutCopy];
            tokenOutRate = _getTokenRate(config.dataFeed, config.stable);
        }

        uint256 amountMTokenInCopy = amountMTokenIn;

        uint256 mTokenRate = mTokenDataFeed.getDataInBase18();

        _tokenTransferFromUser(
            address(mToken),
            address(this),
            amountMTokenWithoutFee,
            18 // mToken always have 18 decimals
        );
        if (feeAmount > 0)
            _tokenTransferFromUser(address(mToken), feeReceiver, feeAmount, 18);

        uint256 requestId = currentRequestId.current();
        currentRequestId.increment();

        redeemRequests[requestId] = Request({
            sender: user,
            tokenOut: tokenOutCopy,
            status: RequestStatus.Pending,
            amountMToken: amountMTokenWithoutFee,
            mTokenRate: mTokenRate,
            tokenOutRate: tokenOutRate
        });

        emit RedeemRequest(requestId, user, tokenOutCopy, amountMTokenInCopy);

        return requestId;
    }

    /**
     * @dev calculates tokenOut amount from USD amount
     * @param amountUsd amount of USD (decimals 18)
     * @param tokenOut tokenOut address
     *
     * @return amountToken converted USD to tokenOut
     * @return tokenRate conversion rate
     */
    function _convertUsdToToken(uint256 amountUsd, address tokenOut)
        internal
        view
        returns (uint256 amountToken, uint256 tokenRate)
    {
        require(amountUsd > 0, "RV: amount zero");

        TokenConfig storage tokenConfig = tokensConfig[tokenOut];

        tokenRate = _getTokenRate(tokenConfig.dataFeed, tokenConfig.stable);
        require(tokenRate > 0, "RV: rate zero");

        amountToken = (amountUsd * (10**18)) / tokenRate;
    }

    /**
     * @dev calculates USD amount from mToken amount
     * @param amountMToken amount of mToken (decimals 18)
     *
     * @return amountUsd converted amount to USD
     * @return mTokenRate conversion rate
     */
    function _convertMTokenToUsd(uint256 amountMToken)
        internal
        view
        returns (uint256 amountUsd, uint256 mTokenRate)
    {
        require(amountMToken > 0, "RV: amount zero");

        mTokenRate = _getTokenRate(address(mTokenDataFeed), false);
        require(mTokenRate > 0, "RV: rate zero");

        amountUsd = (amountMToken * mTokenRate) / (10**18);
    }

    /**
     * @dev validate redeem and calculate fee
     * @param user user address
     * @param tokenOut tokenOut address
     * @param amountMTokenIn mToken amount (decimals 18)
     * @param isInstant is instant operation
     * @param isFiat is fiat operation
     *
     * @return feeAmount fee amount in mToken
     * @return amountMTokenWithoutFee mToken amount without fee
     */
    function _calcAndValidateRedeem(
        address user,
        address tokenOut,
        uint256 amountMTokenIn,
        bool isInstant,
        bool isFiat
    )
        internal
        view
        returns (uint256 feeAmount, uint256 amountMTokenWithoutFee)
    {
        require(amountMTokenIn > 0, "RV: invalid amount");

        if (!isFreeFromMinAmount[user]) {
            uint256 minRedeemAmount = isFiat ? minFiatRedeemAmount : minAmount;
            require(minRedeemAmount <= amountMTokenIn, "RV: amount < min");
        }

        feeAmount = _getFeeAmount(
            user,
            tokenOut,
            amountMTokenIn,
            isInstant,
            isFiat ? fiatAdditionalFee : 0
        );

        if (isFiat) {
            require(
                tokenOut == MANUAL_FULLFILMENT_TOKEN,
                "RV: tokenOut != fiat"
            );
            if (!waivedFeeRestriction[user]) feeAmount += fiatFlatFee;
        } else {
            _requireTokenExists(tokenOut);
        }

        require(amountMTokenIn > feeAmount, "RV: amountMTokenIn < fee");

        amountMTokenWithoutFee = amountMTokenIn - feeAmount;
    }
}
