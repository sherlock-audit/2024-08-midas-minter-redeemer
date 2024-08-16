import * as hre from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { getCurrentAddresses } from '../../config/constants/addresses';
import {
  // eslint-disable-next-line camelcase
  MidasAccessControl__factory,
  // eslint-disable-next-line camelcase
  EUSD__factory,
} from '../../typechain-types';
const forToken = 'eUSD';

const rolesTransferTo = '0xf651032419e3a19A3f8B1A350427b94356C86Bf4';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  const owner = await hre.ethers.getSigner(deployer);

  const addresses = getCurrentAddresses(hre);

  if (!addresses) {
    throw new Error('Addresses are not set');
  }

  const tokenAddresses = addresses[forToken];

  if (!tokenAddresses) throw new Error('Token addresses are not set');

  // eslint-disable-next-line camelcase
  const ac = MidasAccessControl__factory.connect(
    addresses.accessControl!,
    owner,
  );

  // eslint-disable-next-line camelcase
  const eusd = EUSD__factory.connect(addresses.eUSD!.token!, owner);
  const rolesToTransfer = [
    await ac.DEPOSIT_VAULT_ADMIN_ROLE(),
    await ac.REDEMPTION_VAULT_ADMIN_ROLE(),
    await ac.GREENLIST_OPERATOR_ROLE(),
    await ac.BLACKLIST_OPERATOR_ROLE(),
    await ac.M_TBILL_MINT_OPERATOR_ROLE(),
    await ac.M_TBILL_BURN_OPERATOR_ROLE(),
    await ac.M_TBILL_PAUSE_OPERATOR_ROLE(),
    await ac.DEFAULT_ADMIN_ROLE(),
  ];

  const newRolesToGrant = [
    await eusd.E_USD_BURN_OPERATOR_ROLE(),
    await eusd.E_USD_MINT_OPERATOR_ROLE(),
    await eusd.E_USD_PAUSE_OPERATOR_ROLE(),
  ];

  const rolesToGrant = [...rolesToTransfer, ...newRolesToGrant];

  const txGrant = await ac.grantRoleMult(
    rolesToGrant,
    rolesToGrant.map((_) => rolesTransferTo),
  );

  console.log(txGrant.hash);
  await txGrant.wait(4);

  const txRevoke = await ac.revokeRoleMult(
    rolesToTransfer,
    rolesToTransfer.map((_) => owner.address),
  );

  console.log(txRevoke.hash);
  await txRevoke.wait(4);
};

func(hre).then(console.log).catch(console.error);
