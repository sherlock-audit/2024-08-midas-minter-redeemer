/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

pragma solidity 0.8.9;

/**
 * @title ILiquiditySource
 */
interface ILiquiditySource {
    /**
     * @notice Emitted when liquidity is supplied to a recipient.
     */
    event LiquiditySupplied(address indexed recipient, uint256 amount);

    /**
     * @notice Supplies liquidity to a recipient
     * @param recipient Receiver of liquidity
     * @param amount Amount of liquidity to transfer
     */
    function supplyTo(address recipient, uint256 amount) external;

    /**
     * @notice The available liquidity that can be supplied
     * @return The available liquidity amount
     */
    function availableLiquidity() external view returns (uint256);

    function token() external view returns (address);
}
