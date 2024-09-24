// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/ISanctionsList.sol";
import "../access/WithMidasAccessControl.sol";
import "./MidasInitializable.sol";

/**
 * @title WithSanctionsList
 * @notice Base contract that uses sanctions oracle from
 * Chainalysis to check that user is not sanctioned
 * @author RedDuck Software
 */
abstract contract WithSanctionsList is WithMidasAccessControl {
    /**
     * @notice address of Chainalysis sanctions oracle
     */
    address public sanctionsList;

    /**
     * @dev leaving a storage gap for futures updates
     */
    uint256[50] private __gap;

    /**
     * @param caller function caller (msg.sender)
     * @param newSanctionsList new address of `sanctionsList`
     */
    event SetSanctionsList(
        address indexed caller,
        address indexed newSanctionsList
    );

    /**
     * @dev checks that a given `user` is not sanctioned
     */
    modifier onlyNotSanctioned(address user) {
        address _sanctionsList = sanctionsList;
        if (_sanctionsList != address(0)) {
            require(
                !ISanctionsList(_sanctionsList).isSanctioned(user),
                "WSL: sanctioned"
            );
        }
        _;
    }

    /**
     * @dev upgradeable pattern contract`s initializer
     */
    // solhint-disable func-name-mixedcase
    function __WithSanctionsList_init(
        address _accesControl,
        address _sanctionsList
    ) internal onlyInitializing {
        __WithMidasAccessControl_init(_accesControl);
        __WithSanctionsList_init_unchained(_sanctionsList);
    }

    /**
     * @dev upgradeable pattern contract`s initializer unchained
     */
    // solhint-disable func-name-mixedcase
    function __WithSanctionsList_init_unchained(address _sanctionsList)
        internal
        onlyInitializing
    {
        sanctionsList = _sanctionsList;
    }

    /**
     * @notice updates `sanctionsList` address.
     * can be called only from permissioned actor that have
     * `sanctionsListAdminRole()` role
     * @param newSanctionsList new sanctions list address
     */
    function setSanctionsList(address newSanctionsList) external {
        _onlyRole(sanctionsListAdminRole(), msg.sender);

        sanctionsList = newSanctionsList;
        emit SetSanctionsList(msg.sender, newSanctionsList);
    }

    /**
     * @notice AC role of sanctions list admin
     * @dev address that have this role can use `setSanctionsList`
     * @return role bytes32 role
     */
    function sanctionsListAdminRole() public view virtual returns (bytes32);
}
