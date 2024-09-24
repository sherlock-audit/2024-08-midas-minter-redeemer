// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20Upgradeable as IERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable as SafeERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./MBasisRedemptionVault.sol";
import "../interfaces/IRedemptionVault.sol";
import "../interfaces/IMBASISRedemptionVaultWithSwapper.sol";
import "../libraries/DecimalsCorrectionLibrary.sol";

/**
 * @title MBasisRedemptionVault
 * @notice Smart contract that handles mBASIS minting
 * @author RedDuck Software
 */
contract MBasisRedemptionVaultWithSwapper is
    IMBASISRedemptionVaultWithSwapper,
    MBasisRedemptionVault
{
    using DecimalsCorrectionLibrary for uint256;
    using SafeERC20 for IERC20;

    IRedemptionVault public mTbillRedemptionVault;

    address public liquidityProvider;

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
     * @param _mTbillRedemptionVault mTBILL redemptionVault address
     * @param _liquidityProvider liquidity provider for pull mTBILL
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
        address _requestRedeemer,
        address _mTbillRedemptionVault,
        address _liquidityProvider
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
        _validateAddress(_mTbillRedemptionVault, true);
        _validateAddress(_liquidityProvider, false);

        mTbillRedemptionVault = IRedemptionVault(_mTbillRedemptionVault);
        liquidityProvider = _liquidityProvider;
    }

    /**
     * @notice redeem mToken to tokenOut if daily limit and allowance not exceeded
     * If contract don't have enough tokenOut, mBasis will swap to mTBILL and redeem on mTBILL vault
     * Burns mToken from the user, if swap need mToken just tranfers to contract.
     * Transfers fee in mToken to feeReceiver
     * Transfers tokenOut to user.
     * @param tokenOut token out address
     * @param amountMTokenIn amount of mToken to redeem
     * @param minReceiveAmount minimum expected amount of tokenOut to receive (decimals 18)
     */
    function redeemInstant(
        address tokenOut,
        uint256 amountMTokenIn,
        uint256 minReceiveAmount
    )
        external
        override(IRedemptionVault, RedemptionVault)
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
            "RVS: minReceiveAmount > actual"
        );

        if (feeAmount > 0)
            _tokenTransferFromUser(address(mToken), feeReceiver, feeAmount, 18);

        uint256 contractTokenOutBalance = IERC20(tokenOutCopy).balanceOf(
            address(this)
        );

        _requireAndUpdateLimit(amountMTokenInCopy);
        _requireAndUpdateAllowance(tokenOutCopy, amountTokenOut);

        if (
            contractTokenOutBalance >=
            amountTokenOutWithoutFee.convertFromBase18(tokenDecimals)
        ) {
            mToken.burn(user, amountMTokenWithoutFee);
        } else {
            uint256 mTbillAmount = _swapMBasisToMToken(amountMTokenWithoutFee);

            IERC20(mTbillRedemptionVault.mToken()).safeIncreaseAllowance(
                address(mTbillRedemptionVault),
                mTbillAmount
            );

            mTbillRedemptionVault.redeemInstant(
                tokenOutCopy,
                mTbillAmount,
                minReceiveAmountCopy
            );

            uint256 contractTokenOutBalanceAfterRedeem = IERC20(tokenOutCopy)
                .balanceOf(address(this));
            amountTokenOutWithoutFee = (contractTokenOutBalanceAfterRedeem -
                contractTokenOutBalance).convertToBase18(tokenDecimals);
        }

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
     * @inheritdoc IMBASISRedemptionVaultWithSwapper
     */
    function setLiquidityProvider(address provider) external onlyVaultAdmin {
        require(liquidityProvider != provider, "MRVS: already provider");
        _validateAddress(provider, false);

        liquidityProvider = provider;

        emit SetLiquidityProvider(msg.sender, provider);
    }

    /**
     * @notice Transfers mBasis to liquidity provider
     * Transfers mTBILL from liquidity provider to contract
     * Returns amount on mToken using exchange rates
     * @param mBasisAmount mBasis token amount (decimals 18)
     */
    function _swapMBasisToMToken(uint256 mBasisAmount)
        internal
        returns (uint256 mTokenAmount)
    {
        _tokenTransferFromUser(
            address(mToken),
            liquidityProvider,
            mBasisAmount,
            18
        );

        uint256 mTbillRate = mTbillRedemptionVault
            .mTokenDataFeed()
            .getDataInBase18();
        uint256 mTokenRate = mTokenDataFeed.getDataInBase18();
        mTokenAmount = (mBasisAmount * mTokenRate) / mTbillRate;

        _tokenTransferFromTo(
            address(mTbillRedemptionVault.mToken()),
            liquidityProvider,
            address(this),
            mTokenAmount,
            18
        );
    }
}
