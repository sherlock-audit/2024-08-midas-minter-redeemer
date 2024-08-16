// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../mBasis/MBasisRedemptionVaultWithSwapper.sol";

contract MBasisRedemptionVaultWithSwapperTest is
    MBasisRedemptionVaultWithSwapper
{
    function _disableInitializers() internal override {}
}
