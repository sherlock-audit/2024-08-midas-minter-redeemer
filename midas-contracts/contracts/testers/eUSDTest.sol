// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../eUSD/eUSD.sol";

//solhint-disable contract-name-camelcase
contract eUSDTest is eUSD {
    function _disableInitializers() internal override {}
}
