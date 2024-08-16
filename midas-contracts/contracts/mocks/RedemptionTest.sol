// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20Upgradeable as IERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../interfaces/buidl/IRedemption.sol";
import "../interfaces/buidl/ILiquiditySource.sol";
import "../interfaces/buidl/ISettlement.sol";

import "hardhat/console.sol";

contract RedemptionTest is IRedemption {
    address public asset;

    address public liquidity;

    address public settlement;

    constructor(
        address _asset,
        address _liquidity,
        address _settlement
    ) {
        asset = _asset;
        liquidity = _liquidity;
        settlement = _settlement;
    }

    function redeem(uint256 amount) external {
        IERC20(asset).transferFrom(
            msg.sender,
            ISettlement(settlement).recipient(),
            amount
        );
        address token = ILiquiditySource(liquidity).token();
        IERC20(token).transfer(msg.sender, amount);
    }
}
