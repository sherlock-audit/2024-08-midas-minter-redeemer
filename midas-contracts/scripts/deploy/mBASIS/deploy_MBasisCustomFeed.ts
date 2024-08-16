import * as hre from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { M_BASIS_CUSTOM_FEED_CONTRACT_NAME } from '../../../config';
import { getCurrentAddresses } from '../../../config/constants/addresses';
import {
  logDeployProxy,
  tryEtherscanVerifyImplementation,
} from '../../../helpers/utils';

const forToken = 'mBASIS';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const owner = await hre.ethers.getSigner(deployer);

  const addresses = getCurrentAddresses(hre);

  if (!addresses) throw new Error('Addresses are not set');
  const tokenAddresses = addresses[forToken];

  if (!tokenAddresses) throw new Error('Token addresses are not set');

  console.log('Deploying MBasisCustomAggregatorFeed...');
  const deployment = await hre.upgrades.deployProxy(
    await hre.ethers.getContractFactory(
      M_BASIS_CUSTOM_FEED_CONTRACT_NAME,
      owner,
    ),
    [
      addresses?.accessControl,
      0, // FIXME
      1, // FIXME
      hre.ethers.utils.parseUnits('100', 8),
      'mBASIS custom data feed',
    ],
    {
      unsafeAllow: ['constructor'],
    },
  );
  console.log('Deployed MBasisCustomAggregatorFeed:', deployment.address);

  if (deployment.deployTransaction) {
    console.log('Waiting 5 blocks...');
    await deployment.deployTransaction.wait(5);
    console.log('Waited.');
  }

  await logDeployProxy(
    hre,
    M_BASIS_CUSTOM_FEED_CONTRACT_NAME,
    deployment.address,
  );
  await tryEtherscanVerifyImplementation(hre, deployment.address);
};

func(hre).then(console.log).catch(console.error);
