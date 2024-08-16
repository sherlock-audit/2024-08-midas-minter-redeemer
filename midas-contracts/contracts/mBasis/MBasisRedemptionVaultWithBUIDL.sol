// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../RedemptionVaultWithBUIDL.sol";

/**
 * @title MBasisRedemptionVaultWithBUIDL
 * @notice Smart contract that handles mBASIS minting
 * @author RedDuck Software
 */
contract MBasisRedemptionVaultWithBUIDL is RedemptionVaultWIthBUIDL {
    /**
     * @notice actor that can manage MBasisRedemptionVault
     */
    bytes32 public constant M_BASIS_REDEMPTION_VAULT_ADMIN_ROLE =
        keccak256("M_BASIS_REDEMPTION_VAULT_ADMIN_ROLE");

    /**
     * @dev leaving a storage gap for futures updates
     */
    uint256[50] private __gap;

    /**
     * @inheritdoc ManageableVault
     */
    function vaultRole() public pure override returns (bytes32) {
        return M_BASIS_REDEMPTION_VAULT_ADMIN_ROLE;
    }
}
