import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { ConfigPerNetwork } from '../types/index';

type TokenAddresses = {
  customFeed?: string;
  token?: string;
  depositVault?: string;
  redemptionVault?: string;
  tokensReceiver?: string;
};
export interface MidasAddresses {
  mTBILL?: TokenAddresses;
  mBASIS?: TokenAddresses;
  eUSD?: TokenAddresses;
  etfDataFeed?: string;
  eurToUsdFeed?: string;
  accessControl?: string;
}

export const midasAddressesPerNetwork: ConfigPerNetwork<
  MidasAddresses | undefined
> = {
  main: {
    accessControl: '0x0312A9D1Ff2372DDEdCBB21e4B6389aFc919aC4B',
    // TODO: remove this data feed
    etfDataFeed: '0xc747FdDFC46CDC915bEA866D519dFc5Eae5c947f',
    eurToUsdFeed: '0x6022a020Ca5c611304B9E97F37AEE0C38455081A',
    mTBILL: {
      token: '0xDD629E5241CbC5919847783e6C96B2De4754e438',
      tokensReceiver: '0x875c06A295C41c27840b9C9dfDA7f3d819d8bC6A',
      depositVault: '0xcbCf1e67F1988e2572a2A620321Aef2ff73369f0',
      redemptionVault: '0x8978e327FE7C72Fa4eaF4649C23147E279ae1470',
    },
    mBASIS: {
      token: '0x2a8c22E3b10036f3AEF5875d04f8441d4188b656',
      tokensReceiver: '0xB8633297f9D9A8eaD48f1335ab04b14C189639f0',
      depositVault: '0x27C0D44B02E1B732F37ba31C466a35053A7780B8',
      redemptionVault: '0x73cB9a00cEB8FC9134a46eEE20D1fd00BEEe9D84',
    },
    eUSD: {
      tokensReceiver: '0x9d13371c8DeA0361ac78B4c109ea3CB748427CF5',
      token: '0xb5C5f2f9d9d9e7c2E885549AFb857306d119c701',
      depositVault: '0xdD2EC1Da19950B6B836D46882897D0D8fe4cF487',
      redemptionVault: '0x672DCEE688aa1685701a4A4138CB20d07272D116',
    },
  },
  sepolia: {
    mTBILL: {
      redemptionVault: '0xf3482c80d1A2883611De939Af7b0a970d5fcdC06',
      tokensReceiver: '0xa0819ae43115420beb161193b8D8Ba64C9f9faCC',
      depositVault: '0xE85f2B707Ec5Ae8e07238F99562264f304E30109',
      token: '0xefED40D1eb1577d1073e9C4F277463486D39b084',
    },
    mBASIS: {
      token: '0x4089dC8b6637218f13465d28950A82a7E90cBE27',
      tokensReceiver: '0xa0819ae43115420beb161193b8D8Ba64C9f9faCC',
      depositVault: '0x8459f6e174deE33FC72BDAE74a3080751eC92c27',
      redemptionVault: '0x141f0E9ed8bA2295254C9DF9476ccE7bC29172B1',
    },
    eUSD: {
      token: '0xDd5a54bA2aB379A5e642c58F98aD793A183960E2',
      tokensReceiver: '0xa0819ae43115420beb161193b8D8Ba64C9f9faCC',
      depositVault: '0x056339C044055819E8Db84E71f5f2E1F536b2E5b',
      redemptionVault: '0xE4f2AE539442e1D3Fb40F03ceEbF4A372a390d24',
    },
    etfDataFeed: '0x4E677F7FE252DE44682a913f609EA3eb6F29DC3E',
    eurToUsdFeed: '0xE23c07Ecad6D822500CbE8306d72A90578CA9F11',
    accessControl: '0xbf25b58cB8DfaD688F7BcB2b87D71C23A6600AaC',
  },
  hardhat: undefined,
  etherlink: {
    accessControl: '0xa8a5c4FF4c86a459EBbDC39c5BE77833B3A15d88',
    eUSD: {
      token: '0x19AB19e61A930bc5C7B75Bf06cDd954218Ca9F0b',
      tokensReceiver: '0xf651032419e3a19A3f8B1A350427b94356C86Bf4',
      redemptionVault: '0x0D89C1C4799353F3805A3E6C4e1Cbbb83217D123',
    },
  },
  localhost: {
    mTBILL: {
      token: '0xDD629E5241CbC5919847783e6C96B2De4754e438',
      tokensReceiver: '0x875c06A295C41c27840b9C9dfDA7f3d819d8bC6A',
      depositVault: '0xcbCf1e67F1988e2572a2A620321Aef2ff73369f0',
      redemptionVault: '0x8978e327FE7C72Fa4eaF4649C23147E279ae1470',
    },
    mBASIS: {
      token: '0xDDFDa068cd7975690a3B272cFec3513B04A8bC1e',
      tokensReceiver: '0xB8633297f9D9A8eaD48f1335ab04b14C189639f0',
    },
    accessControl: '0x0312A9D1Ff2372DDEdCBB21e4B6389aFc919aC4B',
    etfDataFeed: '0xc747FdDFC46CDC915bEA866D519dFc5Eae5c947f',
    eurToUsdFeed: '0x6022a020Ca5c611304B9E97F37AEE0C38455081A',
  },
};

export const getCurrentAddresses = (hre: HardhatRuntimeEnvironment) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (midasAddressesPerNetwork as any)[hre.network.name] as
    | MidasAddresses
    | undefined;
};
