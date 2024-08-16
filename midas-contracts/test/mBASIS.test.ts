import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { parseUnits } from 'ethers/lib/utils';
import { ethers } from 'hardhat';

import { blackList, acErrors, unBlackList } from './common/ac.helpers';
import { defaultDeploy } from './common/fixtures';
import { burn, mint, setMetadataTest } from './common/mTBILL.helpers';

describe('mBASIS', function () {
  it('deployment', async () => {
    const { mBASIS } = await loadFixture(defaultDeploy);

    expect(await mBASIS.name()).eq('Midas Basis Trading Token');
    expect(await mBASIS.symbol()).eq('mBASIS');

    expect(await mBASIS.paused()).eq(false);
  });

  it('initialize', async () => {
    const { mBASIS } = await loadFixture(defaultDeploy);

    await expect(mBASIS.initialize(ethers.constants.AddressZero)).revertedWith(
      'Initializable: contract is already initialized',
    );
  });

  describe('pause()', () => {
    it('should fail: call from address without M_BASIS_PAUSE_OPERATOR_ROLE role', async () => {
      const { mBASIS, regularAccounts } = await loadFixture(defaultDeploy);
      const caller = regularAccounts[0];

      await expect(mBASIS.connect(caller).pause()).revertedWith(
        acErrors.WMAC_HASNT_ROLE,
      );
    });

    it('should fail: call when already paused', async () => {
      const { owner, mBASIS } = await loadFixture(defaultDeploy);

      await mBASIS.connect(owner).pause();
      await expect(mBASIS.connect(owner).pause()).revertedWith(
        `Pausable: paused`,
      );
    });

    it('call when unpaused', async () => {
      const { owner, mBASIS } = await loadFixture(defaultDeploy);
      expect(await mBASIS.paused()).eq(false);
      await expect(mBASIS.connect(owner).pause()).to.emit(
        mBASIS,
        mBASIS.interface.events['Paused(address)'].name,
      ).to.not.reverted;
      expect(await mBASIS.paused()).eq(true);
    });
  });

  describe('unpause()', () => {
    it('should fail: call from address without M_BASIS_PAUSE_OPERATOR_ROLE role', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );
      const caller = regularAccounts[0];

      await mBASIS.connect(owner).pause();
      await expect(mBASIS.connect(caller).unpause()).revertedWith(
        acErrors.WMAC_HASNT_ROLE,
      );
    });

    it('should fail: call when already paused', async () => {
      const { owner, mBASIS } = await loadFixture(defaultDeploy);

      await expect(mBASIS.connect(owner).unpause()).revertedWith(
        `Pausable: not paused`,
      );
    });

    it('call when paused', async () => {
      const { owner, mBASIS } = await loadFixture(defaultDeploy);
      expect(await mBASIS.paused()).eq(false);
      await mBASIS.connect(owner).pause();
      expect(await mBASIS.paused()).eq(true);

      await expect(mBASIS.connect(owner).unpause()).to.emit(
        mBASIS,
        mBASIS.interface.events['Unpaused(address)'].name,
      ).to.not.reverted;

      expect(await mBASIS.paused()).eq(false);
    });
  });

  describe('mint()', () => {
    it('should fail: call from address without M_BASIS_MINT_OPERATOR_ROLE role', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );
      const caller = regularAccounts[0];

      await mint({ mBASIS, owner }, owner, 0, {
        from: caller,
        revertMessage: acErrors.WMAC_HASNT_ROLE,
      });
    });

    it('call from address with M_BASIS_MINT_OPERATOR_ROLE role', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );

      const amount = parseUnits('100');
      const to = regularAccounts[0].address;

      await mint({ mBASIS, owner }, to, amount);
    });
  });

  describe('burn()', () => {
    it('should fail: call from address without M_BASIS_BURN_OPERATOR_ROLE role', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );
      const caller = regularAccounts[0];

      await burn({ mBASIS, owner }, owner, 0, {
        from: caller,
        revertMessage: acErrors.WMAC_HASNT_ROLE,
      });
    });

    it('should fail: call when user has insufficient balance', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );

      const amount = parseUnits('100');
      const to = regularAccounts[0].address;

      await burn({ mBASIS, owner }, to, amount, {
        revertMessage: 'ERC20: burn amount exceeds balance',
      });
    });

    it('call from address with M_BASIS_MINT_OPERATOR_ROLE role', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );

      const amount = parseUnits('100');
      const to = regularAccounts[0].address;

      await mint({ mBASIS, owner }, to, amount);
      await burn({ mBASIS, owner }, to, amount);
    });
  });

  describe('setMetadata()', () => {
    it('should fail: call from address without DEFAULT_ADMIN_ROLE role', async () => {
      const { owner, mBASIS, regularAccounts } = await loadFixture(
        defaultDeploy,
      );
      const caller = regularAccounts[0];
      await setMetadataTest({ mBASIS, owner }, 'url', 'some value', {
        from: caller,
        revertMessage: acErrors.WMAC_HASNT_ROLE,
      });
    });

    it('call from address with DEFAULT_ADMIN_ROLE role', async () => {
      const { owner, mBASIS } = await loadFixture(defaultDeploy);
      await setMetadataTest({ mBASIS, owner }, 'url', 'some value', undefined);
    });
  });

  describe('_beforeTokenTransfer()', () => {
    it('should fail: mint(...) when address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);
      const blacklisted = regularAccounts[0];

      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );
      await mint({ mBASIS, owner }, blacklisted, 1, {
        revertMessage: acErrors.WMAC_HAS_ROLE,
      });
    });

    it('should fail: transfer(...) when from address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);
      const blacklisted = regularAccounts[0];
      const to = regularAccounts[1];

      await mint({ mBASIS, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );

      await expect(
        mBASIS.connect(blacklisted).transfer(to.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('should fail: transfer(...) when to address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);
      const blacklisted = regularAccounts[0];
      const from = regularAccounts[1];

      await mint({ mBASIS, owner }, from, 1);
      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );

      await expect(
        mBASIS.connect(from).transfer(blacklisted.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('should fail: transferFrom(...) when from address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);
      const blacklisted = regularAccounts[0];
      const to = regularAccounts[1];

      await mint({ mBASIS, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );

      await mBASIS.connect(blacklisted).approve(to.address, 1);

      await expect(
        mBASIS.connect(to).transferFrom(blacklisted.address, to.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('should fail: transferFrom(...) when to address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);

      const blacklisted = regularAccounts[0];
      const from = regularAccounts[1];
      const caller = regularAccounts[2];

      await mint({ mBASIS, owner }, from, 1);

      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );
      await mBASIS.connect(from).approve(caller.address, 1);

      await expect(
        mBASIS
          .connect(caller)
          .transferFrom(from.address, blacklisted.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);
    });

    it('burn(...) when address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);
      const blacklisted = regularAccounts[0];

      await mint({ mBASIS, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );
      await burn({ mBASIS, owner }, blacklisted, 1);
    });

    it('transferFrom(...) when caller address is blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);

      const blacklisted = regularAccounts[0];
      const from = regularAccounts[1];
      const to = regularAccounts[2];

      await mint({ mBASIS, owner }, from, 1);
      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );

      await mBASIS.connect(from).approve(blacklisted.address, 1);

      await expect(
        mBASIS.connect(blacklisted).transferFrom(from.address, to.address, 1),
      ).not.reverted;
    });

    it('transfer(...) when caller address was blacklisted and then un-blacklisted', async () => {
      const { owner, mBASIS, regularAccounts, accessControl } =
        await loadFixture(defaultDeploy);

      const blacklisted = regularAccounts[0];
      const to = regularAccounts[2];

      await mint({ mBASIS, owner }, blacklisted, 1);
      await blackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );

      await expect(
        mBASIS.connect(blacklisted).transfer(to.address, 1),
      ).revertedWith(acErrors.WMAC_HAS_ROLE);

      await unBlackList(
        { blacklistable: mBASIS, accessControl, owner },
        blacklisted,
      );

      await expect(mBASIS.connect(blacklisted).transfer(to.address, 1)).not
        .reverted;
    });
  });
});
