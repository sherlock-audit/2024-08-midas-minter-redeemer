// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../feeds/CustomAggregatorV3CompatibleFeed.sol";

/**
 * @title MTBillCustomAggregatorFeed
 * @notice AggregatorV3 compatible feed for mTBILL,
 * where price is submitted manually by feed admins
 * @author RedDuck Software
 */
contract MTBillCustomAggregatorFeed is CustomAggregatorV3CompatibleFeed {
    /**
     * @notice actor that can manage MTBillCustomAggregatorFeed
     */
    bytes32 public constant M_TBILL_CUSTOM_AGGREGATOR_FEED_ADMIN_ROLE =
        keccak256("M_TBILL_CUSTOM_AGGREGATOR_FEED_ADMIN_ROLE");

    /**
     * @inheritdoc CustomAggregatorV3CompatibleFeed
     */
    function feedAdminRole() public pure override returns (bytes32) {
        return M_TBILL_CUSTOM_AGGREGATOR_FEED_ADMIN_ROLE;
    }
}
