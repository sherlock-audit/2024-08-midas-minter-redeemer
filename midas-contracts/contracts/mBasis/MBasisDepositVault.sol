// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../DepositVault.sol";

/**
 * @title MBasisDepositVault
 * @notice Smart contract that handles mBASIS minting
 * @author RedDuck Software
 */
contract MBasisDepositVault is DepositVault {
    /**
     * @notice actor that can manage MBasisDepositVault
     */
    bytes32 public constant M_BASIS_DEPOSIT_VAULT_ADMIN_ROLE =
        keccak256("M_BASIS_DEPOSIT_VAULT_ADMIN_ROLE");

    /**
     * @dev leaving a storage gap for futures updates
     */
    uint256[50] private __gap;

    /**
     * @inheritdoc ManageableVault
     */
    function vaultRole() public pure override returns (bytes32) {
        return M_BASIS_DEPOSIT_VAULT_ADMIN_ROLE;
    }
}
