import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumberish } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { getAllRoles } from './common.helpers';

import {
  AggregatorV3Interface,
  DataFeed,
  DepositVault,
  MidasAccessControl,
  RedemptionVault,
  MTBILL,
} from '../../typechain-types';

type Params = {
  accessControl: MidasAccessControl;
  mTBILL: MTBILL;
  dataFeed: DataFeed;
  dataFeedMToken: DataFeed;
  aggregator: AggregatorV3Interface;
  depositVault: DepositVault;
  aggregatorMToken: AggregatorV3Interface;
  redemptionVault: RedemptionVault;
  owner: SignerWithAddress;
  tokensReceiver: string;
  minMTokenAmountForFirstDeposit: BigNumberish;
  minAmount: BigNumberish;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute?: (role: string, address: string) => Promise<any>;
};

export const initGrantRoles = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: // accessControl,
  // depositVault,
  // redemptionVault,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // mTBILL,
  // owner,
  // execute,
  Omit<
    Params,
    | 'aggregator'
    | 'dataFeed'
    | 'dataFeedMToken'
    | 'aggregatorMToken'
    | 'minAmountToDeposit'
    | 'tokensReceiver'
  >,
) => {
  // const roles = await getAllRoles(accessControl);
  // const checkAndExecute = async (role: string, address: string) => {
  //   if (!(await accessControl.hasRole(role, address))) {
  //     if (execute) await execute(role, address);
  //     else {
  //       await accessControl
  //         .connect(owner)
  //         .grantRole(role, address)
  //         .then((tx) => tx.wait());
  //     }
  //   }
  // };
  // await checkAndExecute(roles.minter, depositVault.address);
  // await checkAndExecute(roles.minter, redemptionVault.address);
  // await checkAndExecute(roles.burner, redemptionVault.address);
};

export const postDeploymentTest = async (
  { ethers }: HardhatRuntimeEnvironment,
  {
    accessControl,
    depositVault,
    redemptionVault,
    mTBILL,
    dataFeedMToken,
    aggregatorMToken,
    owner,
    tokensReceiver,
    minMTokenAmountForFirstDeposit = '0',
    minAmount,
  }: Params,
) => {
  const roles = await getAllRoles(accessControl);

  /** mTBILL tests start */
  expect(await mTBILL.name()).eq('mTBILL');
  expect(await mTBILL.symbol()).eq('mTBILL');
  expect(await mTBILL.paused()).eq(false);

  /** mTBILL tests end */

  /** DataFeed tests start */

  expect(await dataFeedMToken.aggregator()).eq(aggregatorMToken.address);

  /** DataFeed tests end */

  /** DepositVault tests start */

  expect(await depositVault.mToken()).eq(mTBILL.address);

  expect(await depositVault.tokensReceiver()).eq(tokensReceiver);

  expect(await depositVault.ONE_HUNDRED_PERCENT()).eq('10000');

  expect(await depositVault.minMTokenAmountForFirstDeposit()).eq(
    minMTokenAmountForFirstDeposit,
  );
  expect(await depositVault.minAmount()).eq(minAmount);

  expect(await depositVault.vaultRole()).eq(
    await accessControl.DEPOSIT_VAULT_ADMIN_ROLE(),
  );

  expect(await depositVault.MANUAL_FULLFILMENT_TOKEN()).eq(
    ethers.constants.AddressZero,
  );

  /** DepositVault tests end */

  /** RedemptionVault tests start */

  expect(await redemptionVault.mToken()).eq(mTBILL.address);

  expect(await redemptionVault.tokensReceiver()).eq(tokensReceiver);

  expect(await redemptionVault.ONE_HUNDRED_PERCENT()).eq('10000');

  expect(await redemptionVault.vaultRole()).eq(
    await accessControl.REDEMPTION_VAULT_ADMIN_ROLE(),
  );

  expect(await redemptionVault.MANUAL_FULLFILMENT_TOKEN()).eq(
    ethers.constants.AddressZero,
  );

  /** RedemptionVault tests end */

  /** Owners roles tests start */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { blacklisted: _, greenlisted: __, ...rolesToCheck } = roles;

  for (const role of Object.values(rolesToCheck)) {
    expect(await accessControl.hasRole(role, owner.address)).to.eq(true);
  }

  expect(await accessControl.getRoleAdmin(roles.blacklisted)).eq(
    roles.blacklistedOperator,
  );
};