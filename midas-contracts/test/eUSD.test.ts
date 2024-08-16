import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { parseUnits } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

import { blackList, acErrors, unBlackList } from './common/ac.helpers';
import { defaultDeploy } from './common/fixtures';
import { burn, mint, setMetadataTest } from './common/mTBILL.helpers';

describe('eUSD', function () {
  it('deployment', async () => {
    const { eUSD } = await loadFixture(defaultDeploy);

    expect(await eUSD.name()).eq('Midas Eternal USD');
    expect(await eUSD.symbol()).eq('eUSD');

    expect(await eUSD.paused()).eq(false);
  });

  it('initialize', async () => {
    const { eUSD } = await loadFixture(defaultDeploy);

    await expect(eUSD.initialize(ethers.constants.AddressZero)).revertedWith(
      'Initializable: contract is already initialized',
    );
  });

  describe('pause()', () => {
    it('should fail: call from address without E_USD_PAUSE_OPERATOR_ROLE role', async () => {
      const { eUSD, regularAccounts } = await loadFixture(defaultDeploy);
      const caller = regularAccounts[0];

      await expect(eUSD.connect(caller).pause()).revertedWith(
        acErrors.WMAC_HASNT_ROLE,
      );
    });

    it('should fail: call when already paused', async () => {
      const { owner, eUSD } = await loadFixture(defaultDeploy);

      await eUSD.connect(owner).pause();
      await expect(eUSD.connect(owner).pause()).revertedWith(
        `Pausable: paused`,
      );
    });

    it('call when unpaused', async () => {
      const { owner, eUSD } = await loadFixture(defaultDeploy);
      expect(await eUSD.paused()).eq(false);
      await expect(eUSD.connect(owner).pause()).to.emit(
        eUSD,
        eUSD.interface.events['Paused(address)'].name,
      ).to.not.reverted;
      expect(await eUSD.paused()).eq(true);
    });
  });

  describe('unpause()', () => {
    it('should fail: call from address without E_USD_PAUSE_OPERATOR_ROLE role', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);
      const caller = regularAccounts[0];

      await eUSD.connect(owner).pause();
      await expect(eUSD.connect(caller).unpause()).revertedWith(
        acErrors.WMAC_HASNT_ROLE,
      );
    });

    it('should fail: call when already paused', async () => {
      const { owner, eUSD } = await loadFixture(defaultDeploy);

      await expect(eUSD.connect(owner).unpause()).revertedWith(
        `Pausable: not paused`,
      );
    });

    it('call when paused', async () => {
      const { owner, eUSD } = await loadFixture(defaultDeploy);
      expect(await eUSD.paused()).eq(false);
      await eUSD.connect(owner).pause();
      expect(await eUSD.paused()).eq(true);

      await expect(eUSD.connect(owner).unpause()).to.emit(
        eUSD,
        eUSD.interface.events['Unpaused(address)'].name,
      ).to.not.reverted;

      expect(await eUSD.paused()).eq(false);
    });
  });

  describe('mint()', () => {
    it('should fail: call from address without E_USD_MINT_OPERATOR_ROLE role', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);
      const caller = regularAccounts[0];

      await mint({ eUSD, owner }, owner, 0, {
        from: caller,
        revertMessage: acErrors.WMAC_HASNT_ROLE,
      });
    });

    it('call from address with E_USD_MINT_OPERATOR_ROLE role', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);

      const amount = parseUnits('100');
      const to = regularAccounts[0].address;

      await mint({ eUSD, owner }, to, amount);
    });
  });

  describe('burn()', () => {
    it('should fail: call from address without E_USD_BURN_OPERATOR_ROLE role', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);
      const caller = regularAccounts[0];

      await burn({ eUSD, owner }, owner, 0, {
        from: caller,
        revertMessage: acErrors.WMAC_HASNT_ROLE,
      });
    });

    it('should fail: call when user has insufficient balance', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);

      const amount = parseUnits('100');
      const to = regularAccounts[0].address;

      await burn({ eUSD, owner }, to, amount, {
        revertMessage: 'ERC20: burn amount exceeds balance',
      });
    });

    it('call from address with E_USD_MINT_OPERATOR_ROLE role', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);

      const amount = parseUnits('100');
      const to = regularAccounts[0].address;

      await mint({ eUSD, owner }, to, amount);
      await burn({ eUSD, owner }, to, amount);
    });
  });

  describe('setMetadata()', () => {
    it('should fail: call from address without DEFAULT_ADMIN_ROLE role', async () => {
      const { owner, eUSD, regularAccounts } = await loadFixture(defaultDeploy);
      const caller = regularAccounts[0];
      await setMetadataTest({ eUSD, owner }, 'url', 'some value', {
        from: caller,
        revertMessage: acErrors.WMAC_HASNT_ROLE,
      });
    });

    it('call from address with DEFAULT_ADMIN_ROLE role', async () => {
      const { owner, eUSD } = await loadFixture(defaultDeploy);
      await setMetadataTest({ eUSD, owner }, 'url', 'some value', undefined);
    });
  });

  describe('_beforeTokenTransfer()', () => {
    it('should fail: mint(...) when address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );
      const blacklisted = regularAccounts[0];

      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );
      await mint({ eUSD, owner }, blacklisted, 1, {
        revertMessage: acErrors.WMAC_HAS_ROLE,
      });
    });

    it('should fail: transfer(...) when from address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );
      const blacklisted = regularAccounts[0];
      const to = regularAccounts[1];

      await mint({ eUSD, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );

      await expect(
        eUSD.connect(blacklisted).transfer(to.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('should fail: transfer(...) when to address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );
      const blacklisted = regularAccounts[0];
      const from = regularAccounts[1];

      await mint({ eUSD, owner }, from, 1);
      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );

      await expect(
        eUSD.connect(from).transfer(blacklisted.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('should fail: transferFrom(...) when from address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );
      const blacklisted = regularAccounts[0];
      const to = regularAccounts[1];

      await mint({ eUSD, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );

      await eUSD.connect(blacklisted).approve(to.address, 1);

      await expect(
        eUSD.connect(to).transferFrom(blacklisted.address, to.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('should fail: transferFrom(...) when to address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );

      const blacklisted = regularAccounts[0];
      const from = regularAccounts[1];
      const caller = regularAccounts[2];

      await mint({ eUSD, owner }, from, 1);

      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );
      await eUSD.connect(from).approve(caller.address, 1);

      await expect(
        eUSD.connect(caller).transferFrom(from.address, blacklisted.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('burn(...) when address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );
      const blacklisted = regularAccounts[0];

      await mint({ eUSD, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );
      await burn({ eUSD, owner }, blacklisted, 1);
    });

    it('transferFrom(...) when caller address is blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );

      const blacklisted = regularAccounts[0];
      const from = regularAccounts[1];
      const to = regularAccounts[2];

      await mint({ eUSD, owner }, from, 1);
      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );

      await eUSD.connect(from).approve(blacklisted.address, 1);

      await expect(
        eUSD.connect(blacklisted).transferFrom(from.address, to.address, 1),
      ).not.reverted;
    });

    it('transfer(...) when caller address was blacklisted and then un-blacklisted', async () => {
      const { owner, eUSD, regularAccounts, accessControl } = await loadFixture(
        defaultDeploy,
      );

      const blacklisted = regularAccounts[0];
      const to = regularAccounts[2];

      await mint({ eUSD, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );

      await expect(
        eUSD.connect(blacklisted).transfer(to.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);

      await unBlackList(
        { blacklistable: eUSD, accessControl, owner },
        blacklisted,
      );

      await expect(eUSD.connect(blacklisted).transfer(to.address, 1)).not
        .reverted;
    });
  });
});
