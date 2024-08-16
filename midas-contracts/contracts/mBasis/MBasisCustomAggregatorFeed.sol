// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../feeds/CustomAggregatorV3CompatibleFeed.sol";

/**
 * @title MBasisCustomAggregatorFeed
 * @notice AggregatorV3 compatible feed for mBASIS,
 * where price is submitted manually by feed admins
 * @author RedDuck Software
 */
contract MBasisCustomAggregatorFeed is CustomAggregatorV3CompatibleFeed {
    /**
     * @notice actor that can manage MBasisCustomAggregatorFeed
     */
    bytes32 public constant M_BASIS_CUSTOM_AGGREGATOR_FEED_ADMIN_ROLE =
        keccak256("M_BASIS_CUSTOM_AGGREGATOR_FEED_ADMIN_ROLE");

    /**
     * @inheritdoc CustomAggregatorV3CompatibleFeed
     */
    function feedAdminRole() public pure override returns (bytes32) {
        return M_BASIS_CUSTOM_AGGREGATOR_FEED_ADMIN_ROLE;
    }
}
