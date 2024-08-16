// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../eUSD/EUsdRedemptionVault.sol";

contract EUsdRedemptionVaultTest is EUsdRedemptionVault {
    function _disableInitializers() internal override {}
}
