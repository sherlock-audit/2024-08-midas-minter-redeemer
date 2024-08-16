// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../interfaces/buidl/ILiquiditySource.sol";

contract LiquiditySourceTest is ILiquiditySource {
    address public token;

    constructor(address _token) {
        token = _token;
    }

    function supplyTo(address recipient, uint256 amount) external {}

    function availableLiquidity() external view returns (uint256) {}
}
