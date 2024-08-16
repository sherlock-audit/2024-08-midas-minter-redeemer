import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { constants } from 'ethers';

import { acErrors } from './common/ac.helpers';
import { defaultDeploy } from './common/fixtures';
import {
  sanctionUser,
  setSanctionsList,
} from './common/with-sanctions-list.helpers';

import {
  // eslint-disable-next-line camelcase
  WithSanctionsListTester__factory,
} from '../typechain-types';

describe('WithSanctionsList', function () {
  it('deployment', async () => {
    const { accessControl, withSanctionsListTester } = await loadFixture(
      defaultDeploy,
    );

    expect(await withSanctionsListTester.accessControl()).eq(
      accessControl.address,
    );
  });

  it('onlyInitializing', async () => {
    const { owner } = await loadFixture(defaultDeploy);

    const withSanctionsList = await new WithSanctionsListTester__factory(
      owner,
    ).deploy();

    await expect(
      withSanctionsList.initializeWithoutInitializer(
        constants.AddressZero,
        constants.AddressZero,
      ),
    ).revertedWith('Initializable: contract is not initializing');
  });

  describe('modifier onlyNotSanctioned', () => {
    it('should fail: call from sanctioned user', async () => {
      const { withSanctionsListTester, mockedSanctionsList, regularAccounts } =
        await loadFixture(defaultDeploy);

      await sanctionUser(
        { sanctionsList: mockedSanctionsList },
        regularAccounts[0],
      );

      await expect(
        withSanctionsListTester.onlyNotSanctionedTester(
          regularAccounts[0].address,
        ),
      ).revertedWith('WSL: sanctioned');
    });

    it('call from not sanctioned user', async () => {
      const { withSanctionsListTester, regularAccounts } = await loadFixture(
        defaultDeploy,
      );

      await expect(
        withSanctionsListTester.onlyNotSanctionedTester(
          regularAccounts[0].address,
        ),
      ).not.reverted;
    });
  });

  describe('setSanctionsList', () => {
    it('should fail: call from user without `sanctionsListAdminRole` role', async () => {
      const { withSanctionsListTester, owner, regularAccounts } =
        await loadFixture(defaultDeploy);

      await setSanctionsList(
        { withSanctionsList: withSanctionsListTester, owner },
        constants.AddressZero,
        {
          from: regularAccounts[0],
          revertMessage: acErrors.WMAC_HASNT_ROLE,
        },
      );
    });

    it('call from user with `sanctionsListAdminRole` role', async () => {
      const { accessControl, withSanctionsListTester, owner } =
        await loadFixture(defaultDeploy);

      await accessControl.grantRole(
        await withSanctionsListTester.sanctionsListAdminRole(),
        owner.address,
      );

      await setSanctionsList(
        { withSanctionsList: withSanctionsListTester, owner },
        constants.AddressZero,
      );
    });
  });
});
