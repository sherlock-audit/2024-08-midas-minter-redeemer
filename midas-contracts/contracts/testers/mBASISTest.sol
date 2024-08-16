// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../mBasis/mBASIS.sol";

//solhint-disable contract-name-camelcase
contract mBASISTest is mBASIS {
    function _disableInitializers() internal override {}
}
