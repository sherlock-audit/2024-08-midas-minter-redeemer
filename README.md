
# Midas / Minter/ Redeemer contest details

- Join [Sherlock Discord](https://discord.gg/MABEWyASkp)
- Submit findings using the issue page in your private contest repo (label issues as med or high)
- [Read for more details](https://docs.sherlock.xyz/audits/watsons)

# Q&A

### Q: On what chains are the smart contracts going to be deployed?
The contracts will be deployed on Ethereum, or any EVM-compatible network
___

### Q: If you are integrating tokens, are you allowing only whitelisted tokens to work with the codebase or any complying with the standard? Are they assumed to have certain properties, e.g. be non-reentrant? Are there any types of [weird tokens](https://github.com/d-xo/weird-erc20) you want to integrate?
The protocol only accepts whitelisted tokens (e.g. USDC, WBTC, mTBILL, mBASIS)
___

### Q: Are there any limitations on values set by admins (or other roles) in the codebase, including restrictions on array lengths?
All percentages should be  <= 100%
All percentages for fees should be also be >= 0 (except of ManageableVault::_variationTolerance - it should be > 0)
___

### Q: Are there any limitations on values set by admins (or other roles) in protocols you integrate with, including restrictions on array lengths?
1. Allowance limit per payment token. Mintint/redeeming of mToken is limited by the admin and this limit is set per input/output tokens
2. Answers from DataFeed contract, that are fetched from Chainlink compatible feed, are limited by the min/max prices, that are set during the DataFeed deployment
___

### Q: For permissioned functions, please list all checks and requirements that will be made before calling the function.
onlyRole() - Checks if the permissioned function is being called by an address with its respective admin role (i.e. M_TBILL_MINT_OPERATOR_ROLE in the case of issuance).
onlyNotBlacklisted() - Checks that from and to addresses are not currently assigned the BLACKLISTED_ROLE.
onlyGreenlisted() - Checks that the address is currently assigned the GREENLISTED_ROLE.

___

### Q: Is the codebase expected to comply with any EIPs? Can there be/are there any deviations from the specification?
We strive to keep mTBILL and mBASIS as ERC20 compliant as possible.
___

### Q: Are there any off-chain mechanisms or off-chain procedures for the protocol (keeper bots, arbitrage bots, etc.)?
In case of manual deposit/redemptions requests, the conversion of tokens deposits/redemptions to/from mTBILL/mBASIS tokens and vice-versa is performed offchain. These assets are bankruptcy protected, with attestation reports posted daily on the Midas site.
___

### Q: Are there any hardcoded values that you intend to change before (some) deployments?
No
___

### Q: If the codebase is to be deployed on an L2, what should be the behavior of the protocol in case of sequencer issues (if applicable)? Should Sherlock assume that the Sequencer won't misbehave, including going offline?
Sherlock should assume that the Sequencer won't misbehave, including going offline.
___

### Q: Should potential issues, like broken assumptions about function behavior, be reported if they could pose risks in future integrations, even if they might not be an issue in the context of the scope? If yes, can you elaborate on properties/invariants that should hold?
Yes. The expected functionality and invariants are explained in the following doc: https://ludicrous-rate-748.notion.site/8060186191934380800b669406f4d83c?v=35634cda6b084e2191b83f295433efdf
___

### Q: Please discuss any design choices you made.
mTBILL and mBASIS are an accumulating, ERC20 tokens
___

### Q: Please list any known issues and explicitly state the acceptable risks for each known issue.
Centralization Risk: We are aware that our management roles and processes results in a centralized system requiring trust.
Converisons: mTBILL/mBASIS price oracles are centrilized, so the price posted by a permissioned actor is trusted by the design
Stable Pricing: The system currently assumes that the price of one stablecoin is equal to one dollar. This is a design choice
Malicious Admin: We are aware that admin addresses can change the role designations of interacting addresses and perform various tasks, such as adding and removing wallets from the Blacklist, minting and burning tokens, and altering accepted payment tokens. We are open to suggestions on methods to further restrain these roles without negatively impacting the operation flow and flexibility of the code.
Minimum Deposit Check: The minimum deposit threshold is only applied to first-time depositors. This is intended, as this validation is only required for a user's first deposit.
Upgrade compatibility with previous vault versions: currently deployed vaults wont be upgraded, we will deploy new vault instances with newest implementation 
Fees and exchange rates: the fees/exchange rates that are evolving between the standard request, and the processing are not a bug.
___

### Q: We will report issues where the core protocol functionality is inaccessible for at least 7 days. Would you like to override this value?
N/A
___

### Q: Please provide links to previous audits (if any).
Hacken #1 https://2732961456-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FsPjk0ggBxEJCCnVFFkDR%2Fuploads%2F1wxK6TgqaRsSgt3ixVMx%2FMidas_SC%20Audit%20Report_25092023_%5BSA-1833%5D%20-%20POST%20REMEDIATION.pdf?alt=media&token=cdcf6533-7366-42db-9d3b-224efac85b9a

Hacken #2 https://2732961456-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FsPjk0ggBxEJCCnVFFkDR%2Fuploads%2F38N1bo36K8FLriRrPDXb%2FHacken_Midas_%5BSCA%5D%20Midas_Vault_Dec2023_P-2023-076_1_20240118%2016_22.pdf?alt=media&token=2c58f6f7-889e-4c64-ac84-35bad59eb51a

Sherlock #1  https://audits.sherlock.xyz/contests/332/report
___

### Q: Please list any relevant protocol resources.
Documentation: https://docs.midas.app/
Website: https://midas.app/
X/Twitter: https://twitter.com/MidasRWA
___

### Q: Additional audit information.
Midas strongly encourages auditors to read the documents listed below to understand the design and behavior expectations (from the specification).

Diff PR with the last Sherlock`s audit
https://github.com/RedDuck-Software/midas-contracts/pull/59

Product Requirements (Specifications). Please note that discrepancies between the spec and the code can be reported as issues
https://ludicrous-rate-748.notion.site/8060186191934380800b669406f4d83c?v=35634cda6b084e2191b83f295433efdf

High-level summary: main flows short description
https://docs.google.com/document/d/1z3H3cAS1qBAAHqMAyD2YGmSyGzcle9-awrPT9W2NRzY/edit?usp=sharing
___



# Audit scope


[midas-contracts @ 4abcc5b26cb80a725132c6b21f4d03228d804a59](https://github.com/RedDuck-Software/midas-contracts/tree/4abcc5b26cb80a725132c6b21f4d03228d804a59)
- [midas-contracts/contracts/DepositVault.sol](midas-contracts/contracts/DepositVault.sol)
- [midas-contracts/contracts/RedemptionVault.sol](midas-contracts/contracts/RedemptionVault.sol)
- [midas-contracts/contracts/RedemptionVaultWithBUIDL.sol](midas-contracts/contracts/RedemptionVaultWithBUIDL.sol)
- [midas-contracts/contracts/abstract/ManageableVault.sol](midas-contracts/contracts/abstract/ManageableVault.sol)
- [midas-contracts/contracts/abstract/WithSanctionsList.sol](midas-contracts/contracts/abstract/WithSanctionsList.sol)
- [midas-contracts/contracts/access/Blacklistable.sol](midas-contracts/contracts/access/Blacklistable.sol)
- [midas-contracts/contracts/access/Greenlistable.sol](midas-contracts/contracts/access/Greenlistable.sol)
- [midas-contracts/contracts/access/MidasAccessControl.sol](midas-contracts/contracts/access/MidasAccessControl.sol)
- [midas-contracts/contracts/access/MidasAccessControlRoles.sol](midas-contracts/contracts/access/MidasAccessControlRoles.sol)
- [midas-contracts/contracts/access/Pausable.sol](midas-contracts/contracts/access/Pausable.sol)
- [midas-contracts/contracts/access/WithMidasAccessControl.sol](midas-contracts/contracts/access/WithMidasAccessControl.sol)
- [midas-contracts/contracts/feeds/CustomAggregatorV3CompatibleFeed.sol](midas-contracts/contracts/feeds/CustomAggregatorV3CompatibleFeed.sol)
- [midas-contracts/contracts/interfaces/IDepositVault.sol](midas-contracts/contracts/interfaces/IDepositVault.sol)
- [midas-contracts/contracts/interfaces/IMBASISRedemptionVaultWithSwapper.sol](midas-contracts/contracts/interfaces/IMBASISRedemptionVaultWithSwapper.sol)
- [midas-contracts/contracts/interfaces/IManageableVault.sol](midas-contracts/contracts/interfaces/IManageableVault.sol)
- [midas-contracts/contracts/interfaces/IRedemptionVault.sol](midas-contracts/contracts/interfaces/IRedemptionVault.sol)
- [midas-contracts/contracts/interfaces/ISanctionsList.sol](midas-contracts/contracts/interfaces/ISanctionsList.sol)
- [midas-contracts/contracts/libraries/DecimalsCorrectionLibrary.sol](midas-contracts/contracts/libraries/DecimalsCorrectionLibrary.sol)
- [midas-contracts/contracts/mBasis/MBasisCustomAggregatorFeed.sol](midas-contracts/contracts/mBasis/MBasisCustomAggregatorFeed.sol)
- [midas-contracts/contracts/mBasis/MBasisDepositVault.sol](midas-contracts/contracts/mBasis/MBasisDepositVault.sol)
- [midas-contracts/contracts/mBasis/MBasisRedemptionVault.sol](midas-contracts/contracts/mBasis/MBasisRedemptionVault.sol)
- [midas-contracts/contracts/mBasis/MBasisRedemptionVaultWithBUIDL.sol](midas-contracts/contracts/mBasis/MBasisRedemptionVaultWithBUIDL.sol)
- [midas-contracts/contracts/mBasis/MBasisRedemptionVaultWithSwapper.sol](midas-contracts/contracts/mBasis/MBasisRedemptionVaultWithSwapper.sol)
- [midas-contracts/contracts/mBasis/mBASIS.sol](midas-contracts/contracts/mBasis/mBASIS.sol)
- [midas-contracts/contracts/mTBILL/MTBillCustomAggregatorFeed.sol](midas-contracts/contracts/mTBILL/MTBillCustomAggregatorFeed.sol)
- [midas-contracts/contracts/mTBILL/mTBILL.sol](midas-contracts/contracts/mTBILL/mTBILL.sol)


