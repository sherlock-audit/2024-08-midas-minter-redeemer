// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/buidl/ISettlement.sol";

contract SettlementTest is ISettlement {
    address public recipient;

    constructor(address _recipient) {
        recipient = _recipient;
    }
}
