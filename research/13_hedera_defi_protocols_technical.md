# Hedera DeFi Protocols: Technical Reference for AI Agents

> Research Date: 2026-02-20
> Focus: Concrete contract addresses, APIs, SDKs, and code examples for AI agent integration on Hedera testnet and mainnet.

---

## Table of Contents

1. [SaucerSwap (DEX)](#1-saucerswap---the-main-dex-on-hedera)
2. [Bonzo Finance (Lending)](#2-bonzo-finance---lending-protocol)
3. [Other DEXes (HeliSwap, Pangolin, HashPort)](#3-other-hedera-dexes)
4. [Price Oracles (Pyth, Supra, Chainlink)](#4-price-oracles-on-hedera)
5. [Hedera Agent Kit Plugin Ecosystem](#5-hedera-agent-kit-plugin-ecosystem)
6. [Quick Reference Tables](#6-quick-reference-tables)

---

## 1. SaucerSwap - The Main DEX on Hedera

**Status**: Active, production-ready, testnet available
**TVL**: ~$123M (as of early 2026)
**Architecture**: Uniswap V2 fork (V1) + Uniswap V3 fork (V2)
**Website**: https://www.saucerswap.finance/
**Testnet App**: https://testnet.saucerswap.finance/
**Docs**: https://docs.saucerswap.finance/

### 1.1 Contract Addresses - Hedera Testnet

| Contract | Hedera ID |
|----------|-----------|
| WHBAR | 0.0.15057 |
| WHBAR Token | 0.0.15058 |
| WhbarHelper | 0.0.5286055 |
| SaucerSwapV1Factory | 0.0.9959 |
| SaucerSwapV1RouterV3 | 0.0.19264 |
| SaucerSwapV1RouterWithFee | 0.0.4652955 |
| FeeTo | 0.0.10060 |
| Masterchef | 0.0.1179171 |
| Mothership | 0.0.1418650 |
| SAUCE Token | 0.0.1183558 |
| xSAUCE Token | 0.0.1418651 |
| SaucerSwapV2Factory | 0.0.1197038 |
| SaucerSwapV2NonfungiblePositionManager | 0.0.1308184 |
| LP NFT Token | 0.0.1310436 |
| SaucerSwapV2SwapRouter | 0.0.1414040 |
| SaucerSwapV2QuoterV2 | 0.0.1390002 |

### 1.2 Contract Addresses - Hedera Mainnet

| Contract | Hedera ID |
|----------|-----------|
| WHBAR | 0.0.1456985 |
| WHBAR Token | 0.0.1456986 |
| WhbarHelper | 0.0.5808826 |
| SaucerSwapV1Factory | 0.0.1062784 |
| SaucerSwapV1RouterV3 | 0.0.3045981 |
| SaucerSwapV1FeeTo | 0.0.1062785 |
| Masterchef | 0.0.1077627 |
| SaucerSwapRouterWithFee | 0.0.6755814 |
| SaucerSwapV2Factory | 0.0.3946833 |
| SaucerSwapV2SwapRouter | 0.0.3949434 |
| SaucerSwapV2QuoterV2 | 0.0.3949424 |
| SaucerSwapV2NonfungiblePositionManagerV2 | 0.0.4053945 |
| LP NFT Token V2 | 0.0.4054027 |
| SaucerSwapV2TickLens | 0.0.3948950 |
| SaucerSwapV2Oracle | 0.0.3946808 |
| ERC20Wrapper | 0.0.9675688 |
| SAUCE Token | 0.0.731861 |
| xSAUCE Token | 0.0.1460200 |

### 1.3 REST API

**Base URL**: `https://api.saucerswap.finance`

**Authentication**: API key via `x-api-key` header (contact support@saucerswap.finance for credentials). Rate-limited monthly.

**Key Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tokens` | GET | All tokens with pricing, decimals, due diligence status |
| `/pools/` | GET | All V1 liquidity pools with reserves and metadata |
| `/V2/nfts/{accountId}/positions` | GET | User V2 LP positions |
| `/V2/pools/{poolId}` | GET | Specific V2 pool data |

**Mirror Node API** (no auth required): `https://testnet.mirrornode.hedera.com` (testnet) or `https://mainnet.mirrornode.hedera.com` (mainnet)

### 1.4 Code Examples

#### V1 Swap Quote - Get Output Amount (ethers.js)

```typescript
import * as ethers from 'ethers'; // V6
import { TokenId, ContractId } from '@hashgraph/sdk';

// Testnet JSON RPC
const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api', '', {
  batchMaxCount: 1,
});

const abi = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];
const abiInterfaces = new ethers.Interface(abi);

// Testnet addresses
const whbarTokenId = '0.0.15058';
const sauceTokenId = '0.0.1183558';
const routerContractId = '0.0.19264'; // V1RouterV3 on testnet

const tokenIn = '0x' + TokenId.fromString(whbarTokenId).toSolidityAddress();
const tokenOut = '0x' + TokenId.fromString(sauceTokenId).toSolidityAddress();
const route = [tokenIn, tokenOut];

const routerEvmAddress = '0x' + ContractId.fromString(routerContractId).toSolidityAddress();
const routerContract = new ethers.Contract(routerEvmAddress, abiInterfaces.fragments, provider);

// Get quote for 10 HBAR (8 decimals)
const inputAmount = BigInt(10 * 1e8);
const result = await routerContract.getAmountsOut(inputAmount, route);
const outputAmount = result[result.length - 1];
console.log('Output SAUCE amount:', outputAmount.toString());
```

#### V1 Swap Quote - Via Mirror Node REST API (no provider needed)

```typescript
import * as ethers from 'ethers'; // V6
import axios from 'axios';
import { TokenId, ContractId } from '@hashgraph/sdk';

const abi = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];
const abiInterfaces = new ethers.Interface(abi);

const whbarTokenId = '0.0.15058';
const sauceTokenId = '0.0.1183558';
const routerContractId = '0.0.19264';

const tokenIn = '0x' + TokenId.fromString(whbarTokenId).toSolidityAddress();
const tokenOut = '0x' + TokenId.fromString(sauceTokenId).toSolidityAddress();
const route = [tokenIn, tokenOut];

const routerSolidityAddress = ContractId.fromString(routerContractId).toSolidityAddress();
const inputAmount = BigInt(10 * 1e8); // 10 HBAR

const encodedData = abiInterfaces.encodeFunctionData(
  abiInterfaces.getFunction('getAmountsOut')!,
  [inputAmount, route]
);

const mirrorNodeBaseUrl = 'https://testnet.mirrornode.hedera.com';
const url = `${mirrorNodeBaseUrl}/api/v1/contracts/call`;
const data = {
  block: 'latest',
  data: encodedData,
  to: routerSolidityAddress,
};

const response = await axios.post(url, data, {
  headers: { 'content-type': 'application/json' }
});

const amounts = abiInterfaces.decodeFunctionResult('getAmountsOut', response.data.result)[0];
const finalOutputAmount = amounts[amounts.length - 1];
console.log('Output SAUCE amount:', finalOutputAmount.toString());
```

#### V2 Swap - Tokens for HBAR (Hedera SDK + ethers.js)

```typescript
import * as ethers from 'ethers'; // V6
import { ContractExecuteTransaction, ContractId, TokenId, AccountId } from '@hashgraph/sdk';

// V2 uses multicall pattern: exactInputSingle + unwrapWHBAR
const swapRouterAbi = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function unwrapWHBAR(uint256 amountMinimum, address recipient)',
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)'
];

const abiInterfaces = new ethers.Interface(swapRouterAbi);

// Testnet V2 SwapRouter
const swapRouterContractId = '0.0.1414040';
const whbarTokenId = '0.0.15058';
const sauceTokenId = '0.0.1183558';

// Encode exactInputSingle - note: recipient = router address for unwrapWHBAR to work
const swapRouterSolidity = ContractId.fromString(swapRouterContractId).toSolidityAddress();
const tokenIn = '0x' + TokenId.fromString(sauceTokenId).toSolidityAddress();
const tokenOut = '0x' + TokenId.fromString(whbarTokenId).toSolidityAddress();

const swapEncoded = abiInterfaces.encodeFunctionData('exactInputSingle', [{
  tokenIn,
  tokenOut,
  fee: 3000, // 0.3% fee tier
  recipient: '0x' + swapRouterSolidity, // router receives WHBAR first
  deadline: Math.floor(Date.now() / 1000) + 60 * 20,
  amountIn: BigInt(100 * 1e6), // 100 SAUCE (6 decimals)
  amountOutMinimum: 0n,
  sqrtPriceLimitX96: 0n,
}]);

// Encode unwrapWHBAR to convert WHBAR -> HBAR and send to user
const myAddress = AccountId.fromString('0.0.YOUR_ACCOUNT').toSolidityAddress();
const unwrapEncoded = abiInterfaces.encodeFunctionData('unwrapWHBAR', [
  0n, // minimum amount
  '0x' + myAddress
]);

// Multicall both operations atomically
const multicallEncoded = abiInterfaces.encodeFunctionData('multicall', [
  [swapEncoded, unwrapEncoded]
]);

// Execute via Hedera SDK
const tx = new ContractExecuteTransaction()
  .setContractId(ContractId.fromString(swapRouterContractId))
  .setFunctionParameters(Buffer.from(multicallEncoded.slice(2), 'hex'))
  .setGas(1_000_000);
```

### 1.5 NPM Package: `hak-saucerswap-plugin`

**Install**: `npm install hak-saucerswap-plugin`
**Version**: 1.0.1 (tested/endorsed)
**Source**: https://github.com/jmgomezl/hak-saucerswap-plugin

**Available Tools**:

| Tool Name | Description |
|-----------|-------------|
| `saucerswap_get_swap_quote` | Get pricing data for a token pair from SaucerSwap |
| `saucerswap_swap_tokens` | Construct and submit a swap transaction |
| `saucerswap_get_pools` | List or search liquidity pools |
| `saucerswap_add_liquidity` | Create a liquidity provision transaction |
| `saucerswap_remove_liquidity` | Generate a liquidity withdrawal transaction |
| `saucerswap_get_farms` | Display yield farming opportunities |

**Configuration via environment variables**:
```bash
SAUCERSWAP_ROUTER_CONTRACT_ID=0.0.19264       # V1 router (testnet)
SAUCERSWAP_ROUTER_V2_CONTRACT_ID=0.0.1414040  # V2 router (testnet)
SAUCERSWAP_WRAPPED_HBAR_TOKEN_ID=0.0.15058    # WHBAR token (testnet)
```

**Usage with Hedera Agent Kit**:
```typescript
import { HederaLangchainToolkit, AgentMode } from 'hedera-agent-kit';
import { saucerswapPlugin } from 'hak-saucerswap-plugin';
import { Client, PrivateKey } from '@hashgraph/sdk';

const client = Client.forTestnet().setOperator(
  process.env.ACCOUNT_ID!,
  PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
);

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [saucerswapPlugin],
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS }
  }
});

const tools = toolkit.getTools();
// Agent can now call: saucerswap_get_swap_quote, saucerswap_swap_tokens, etc.
```

**Config object approach**:
```typescript
const config = {
  saucerswap: {
    routerContractId: '0.0.19264',
    routerV2ContractId: '0.0.1414040',
    wrappedHbarTokenId: '0.0.15058',
    tokenAliases: { HBAR: '0.0.15058' },
    defaultPoolVersion: 'v2',
  }
};
```

---

## 2. Bonzo Finance - Lending Protocol

**Status**: Active, mainnet launched Oct 28, 2024, testnet available
**TVL**: ~$24.87M
**Architecture**: Aave v2 fork adapted for Hedera EVM + HTS
**Oracle**: Supra Oracles (migrating to Chainlink)
**Website**: https://bonzo.finance/
**Testnet App**: https://testnet.bonzo.finance
**Docs**: https://docs.bonzo.finance/hub/

### 2.1 Contract Addresses - Hedera Testnet

| Contract | Hedera ID |
|----------|-----------|
| LendingPool | 0.0.2664875 |

> Note: The full testnet contract list is maintained at https://docs.bonzo.finance/hub/developer/contract-deployments. The LendingPool address above is verified via HashScan. Additional contracts (LendingPoolConfigurator, LendingPoolAddressesProvider, PriceOracle, etc.) follow the Aave v2 architecture and are deployed alongside the LendingPool.

### 2.2 Testnet Supported Tokens

| Token | Testnet Token ID |
|-------|-----------------|
| HBAR | Native |
| HBARX | 0.0.2231533 |
| SAUCE | 0.0.1183558 |
| xSAUCE | 0.0.1418651 |
| USDC | 0.0.5449 |
| KARATE | 0.0.3772909 (coming soon) |

### 2.3 Testnet Faucet

Available via Bonzo Discord bot:
```
!test_bonzo <TOKEN_NAME> <YOUR_ACCOUNT_ID>
```
- Frequency: Every 8 hours
- Rate: 1 token per account per request
- Available tokens: HBARX, SAUCE, xSAUCE, USDC

### 2.4 Core Operations (Aave v2 Interface)

Bonzo supports the standard Aave v2 LendingPool interface:

| Operation | Solidity Function |
|-----------|-------------------|
| Supply/Deposit | `deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)` |
| Withdraw | `withdraw(address asset, uint256 amount, address to)` |
| Borrow | `borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)` |
| Repay | `repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)` |
| Flash Loan | `flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] calldata modes, address onBehalfOf, bytes calldata params, uint16 referralCode)` |

Interest rate modes: `1` = Stable, `2` = Variable

### 2.5 Bonzo Data API

**Base URL**: `https://mainnet-data-staging.bonzo.finance/`

Provides:
- Real-time market data (supply/borrow APYs, liquidity, utilization rates)
- Account-level supply and borrow position data
- Solvency computations

The API is publicly accessible, no authentication required. OpenAPI spec available.

### 2.6 NPM Package: `@bonzofinancelabs/hak-bonzo-plugin`

**Install**: `npm install @bonzofinancelabs/hak-bonzo-plugin`
**Source**: https://github.com/Bonzo-Labs/bonzoPlugin

**Available Tools**:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `bonzo_market_data_tool` | Get real-time market info (APYs, liquidity, utilization) | None |
| `approve_erc20_tool` | Approve LendingPool to spend tokens | `tokenSymbol`, `amount`, optional: `spender`, `useMax` |
| `bonzo_deposit_tool` | Supply tokens to earn yield | `tokenSymbol`, `amount`, optional: `onBehalfOf`, `referralCode` |
| `bonzo_withdraw_tool` | Withdraw supplied tokens | `tokenSymbol`, `amount`, optional: `to`, `withdrawAll` |
| `bonzo_borrow_tool` | Borrow at stable or variable rate | `tokenSymbol`, `amount`, `rateMode` ("stable"\|"variable"), optional: `onBehalfOf` |
| `bonzo_repay_tool` | Repay borrowed amount | `tokenSymbol`, `amount`, `rateMode`, optional: `onBehalfOf`, `repayAll` |

**Usage with Hedera Agent Kit**:
```typescript
import { HederaLangchainToolkit, AgentMode } from 'hedera-agent-kit';
import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
import { Client, PrivateKey } from '@hashgraph/sdk';

const client = Client.forTestnet().setOperator(
  process.env.ACCOUNT_ID!,
  PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
);

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    context: { mode: AgentMode.AUTONOMOUS },
    plugins: [bonzoPlugin],
    tools: [],
  },
});

const tools = toolkit.getTools();
// Agent can now call: bonzo_deposit_tool, bonzo_borrow_tool, etc.
```

**Important workflow**: Token approval is required before deposit/repay operations:
```
1. approve_erc20_tool(tokenSymbol: "USDC", amount: "1000")
2. bonzo_deposit_tool(tokenSymbol: "USDC", amount: "1000")
```

**Environment Variables**:
```bash
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=0x...
HEDERA_NETWORK=testnet   # or mainnet
OPENAI_API_KEY=sk-...     # for AI agent LLM
```

### 2.7 Direct Contract Interaction (ethers.js)

```typescript
import * as ethers from 'ethers';
import { ContractId, TokenId } from '@hashgraph/sdk';

const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api', '', {
  batchMaxCount: 1,
});

// Aave v2 LendingPool ABI (subset)
const lendingPoolAbi = [
  'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
  'function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf) returns (uint256)',
  'function getUserAccountData(address user) view returns (uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
];

const lendingPoolId = '0.0.2664875'; // Testnet
const lendingPoolEvm = '0x' + ContractId.fromString(lendingPoolId).toSolidityAddress();

const lendingPool = new ethers.Contract(lendingPoolEvm, lendingPoolAbi, provider);

// Query user account data
const userData = await lendingPool.getUserAccountData('0xYOUR_EVM_ADDRESS');
console.log('Health Factor:', ethers.formatUnits(userData.healthFactor, 18));
```

---

## 3. Other Hedera DEXes

### 3.1 HeliSwap

**Status**: Active but smaller (~$6.51M TVL)
**Architecture**: Uniswap V2 fork, supports HTS + ERC20 tokens
**Source**: https://github.com/HeliSwap/HeliSwap-contracts
**Built by**: LimeChain

HeliSwap is the first DEX on Hedera supporting swaps between HTS tokens, ERC20 tokens, and HBAR. The core and periphery contracts are forks of Uniswap V2.

**Testnet Status**: Contract source code is available on GitHub but specific testnet deployment addresses are not publicly documented in a stable way. Testnet addresses may change with Hedera testnet resets.

**Assessment for AI Agents**: Less suitable than SaucerSwap due to smaller ecosystem, less documentation, and no dedicated agent-kit plugin. For AI agent integration, prefer SaucerSwap.

### 3.2 Pangolin

**Status**: Previously active on Hedera, limited recent activity
**Note**: Pangolin is primarily known as an Avalanche DEX. Its Hedera deployment had limited traction and documentation is sparse.

**Assessment for AI Agents**: Not recommended. Limited documentation, unclear testnet availability.

### 3.3 HashPort

**Status**: Active bridge protocol (not a DEX)
**Function**: Cross-chain bridge connecting Hedera to Ethereum, Polygon, Avalanche, and other networks
**Use Case**: Enables transfer of assets between Hedera and other EVM chains

**Assessment for AI Agents**: Useful for cross-chain operations but operates as a bridge, not a trading DEX. No known agent-kit plugin.

---

## 4. Price Oracles on Hedera

### 4.1 Pyth Network

**Status**: Active on Hedera mainnet and testnet
**Feeds Available**: 400+ price feeds (crypto, forex, commodities, equities, ETFs)
**Model**: Pull-based (users post price updates on-chain when needed)

#### Contract Addresses

| Network | Contract Address |
|---------|-----------------|
| Hedera Mainnet | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` |
| Hedera Testnet | `0xa2aa501b19aff244d90cc15a4cf739d2725b5729` |

#### Key Price Feed IDs

Common Pyth price feed IDs (hex, same across all chains):
- **HBAR/USD**: `0x3728e591097b6985e1e5e57c3addbe1c4a1b38dbe87e8c045c0c7d72fb9cff29`
- **BTC/USD**: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **ETH/USD**: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **USDC/USD**: `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a`

> Full feed ID list: https://pyth.network/developers/price-feed-ids

#### Hedera-Specific Consideration

IMPORTANT: Hedera's native token (HBAR) uses **8 decimal places**, not 18 like Ethereum. This affects price calculations when converting between HBAR and USD amounts.

#### Code Example - Reading Pyth Price Feeds

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract PythPriceReader {
    IPyth pyth;

    constructor(address pythContract) {
        pyth = IPyth(pythContract);
    }

    // Get HBAR price in USD
    function getHbarPrice(bytes[] calldata priceUpdateData) public payable returns (int64, uint) {
        uint fee = pyth.getUpdateFee(priceUpdateData);
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        bytes32 hbarFeedId = 0x3728e591097b6985e1e5e57c3addbe1c4a1b38dbe87e8c045c0c7d72fb9cff29;
        PythStructs.Price memory price = pyth.getPrice(hbarFeedId);

        return (price.price, price.expo);
    }

    // Mint an NFT worth $1 using Pyth oracle
    // Note: HBAR has 8 decimals, not 18!
    function mintForOneDollar(bytes[] calldata priceUpdateData) external payable {
        uint fee = pyth.getUpdateFee(priceUpdateData);
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        bytes32 hbarFeedId = 0x3728e591097b6985e1e5e57c3addbe1c4a1b38dbe87e8c045c0c7d72fb9cff29;
        PythStructs.Price memory price = pyth.getPrice(hbarFeedId);

        // Calculate $1 worth of HBAR (8 decimal places for tinybar)
        uint256 oneDollarInHbar = (1e8 * (10 ** uint32(-price.expo))) / uint64(price.price);
        require(msg.value >= oneDollarInHbar + fee, "Insufficient HBAR");
    }
}
```

#### Off-Chain: Fetching Price Updates via Hermes API

```typescript
import axios from 'axios';

const HERMES_URL = 'https://hermes.pyth.network';

// Get latest price for HBAR/USD
const hbarFeedId = '0x3728e591097b6985e1e5e57c3addbe1c4a1b38dbe87e8c045c0c7d72fb9cff29';

const response = await axios.get(`${HERMES_URL}/v2/updates/price/latest`, {
  params: {
    ids: [hbarFeedId],
    encoding: 'hex',
    parsed: true,
  }
});

const priceData = response.data.parsed[0].price;
console.log('HBAR Price:', priceData.price, 'Expo:', priceData.expo);
// e.g., price: 28500, expo: -8 => $0.285

// The binary update data to pass to the on-chain contract
const updateData = response.data.binary.data;
```

#### NPM Package: `hak-pyth-plugin`

**Install**: `npm install hak-pyth-plugin`
**Version**: 0.1.1 (tested/endorsed)
**Source**: https://github.com/jmgomezl/hak-pyth-plugin

Provides access to Pyth Network price feeds via the Hermes API:
- List available price feeds
- Fetch latest prices for any feed

```typescript
import { pythPlugin } from 'hak-pyth-plugin';

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [pythPlugin],
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS }
  }
});
```

### 4.2 Supra Oracles (DORA)

**Status**: Active on Hedera mainnet and testnet
**Model**: Both Pull and Push models supported
**Protocol**: DORA (Distributed Oracle Agreement)

#### Contract Addresses

| Network | Contract Type | Address |
|---------|---------------|---------|
| Hedera Mainnet | Pull Contract | `0x41AB2059bAA4b73E9A3f55D30Dff27179e0eA181` |
| Hedera Mainnet | Storage Contract (Push) | `0xD02cc7a670047b6b012556A88e275c685d25e0c9` |
| Hedera Testnet | Pull Contract | `0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0` |
| Hedera Testnet | Storage Contract (Push) | `0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917` |

Both networks run Supra contracts version 0.2.1.

#### Pull Model - Fetch and Verify Price Data

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISupraPull {
    struct PriceData {
        uint256[] pairs;
        uint256[] prices;
        uint256[] decimals;
    }
    function verifyOracleProof(bytes calldata _bytesproof) external returns (PriceData memory);
}

contract SupraPullConsumer {
    ISupraPull public supra;

    constructor(address _supraContract) {
        supra = ISupraPull(_supraContract);
    }

    function getPrice(bytes calldata proof) external returns (uint256) {
        ISupraPull.PriceData memory data = supra.verifyOracleProof(proof);
        return data.prices[0];
    }
}
```

#### Push Model - Read Pre-Published Prices

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISupraStorage {
    function getPrice(uint256 _pairIndex) external view returns (uint256[4] memory);
    function getPriceForMultiplePair(uint256[] memory _pairIndexes) external view returns (uint256[4][] memory);
}

contract SupraPushConsumer {
    ISupraStorage public supraStorage;

    constructor(address _storageContract) {
        supraStorage = ISupraStorage(_storageContract);
    }

    // Get HBAR/USD price (check Supra docs for pair index)
    function getHbarPrice(uint256 pairIndex) external view returns (uint256) {
        uint256[4] memory data = supraStorage.getPrice(pairIndex);
        // data[0] = round, data[1] = decimals, data[2] = timestamp, data[3] = price
        return data[3];
    }
}
```

#### Important Limitation

The Hedera mirror node API has a **24 KB data payload limit** for contract calls. When using the Pull model, fetch only one price pair at a time to avoid exceeding this limit.

#### Tutorial Repositories

- **Pull Model**: https://github.com/hedera-dev/tutorial-js-supra-oracle-contract-pull
- **Push Model**: https://github.com/hedera-dev/tutorial-js-supra-oracle-contract-push

### 4.3 Chainlink

**Status**: Active on Hedera mainnet (adopted as the standard data provider)
**Integration**: Bonzo Finance uses Chainlink price feeds

#### Known Mainnet Price Feed Addresses

| Feed | Contract Address |
|------|-----------------|
| HBAR/USD | `0xAF685FB45C12b92b5054ccb9313e135525F9b5d5` |
| USDC/USD | `0x2b358642c7C37b6e400911e4FE41770424a7349F` |
| POL/USD | `0x949F...49c7` (partial - check Chainlink data feeds page) |

> Full list: https://data.chain.link/ (filter by Hedera)

#### Code Example - Reading Chainlink Price Feeds

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ChainlinkPriceReader {
    AggregatorV3Interface internal hbarUsdFeed;

    constructor() {
        // HBAR/USD on Hedera Mainnet
        hbarUsdFeed = AggregatorV3Interface(0xAF685FB45C12b92b5054ccb9313e135525F9b5d5);
    }

    function getLatestHbarPrice() public view returns (int256, uint256) {
        (
            /* uint80 roundID */,
            int256 price,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = hbarUsdFeed.latestRoundData();

        return (price, updatedAt);
    }
}
```

#### Testnet Status

Chainlink has limited testnet support on Hedera. For testnet development, **Pyth Network** or **Supra Oracles** are recommended as they have verified testnet deployments.

---

## 5. Hedera Agent Kit Plugin Ecosystem

### 5.1 Overview

The **Hedera Agent Kit** (`hedera-agent-kit` on npm) is the official open-source toolkit for building AI agents that interact with Hedera.

**Install**:
```bash
npm install hedera-agent-kit @langchain/core langchain @langchain/langgraph @langchain/openai @hashgraph/sdk dotenv
```

**GitHub**: https://github.com/hashgraph/hedera-agent-kit-js
**Docs**: https://docs.hedera.com/hedera/open-source-solutions/ai-studio-on-hedera/hedera-ai-agent-kit

### 5.2 Core Plugins (Official)

| Plugin | Capabilities |
|--------|-------------|
| Account Plugin | Transfer HBAR |
| Consensus Plugin | Create topics, submit HCS messages |
| HTS Plugin | Create fungible/non-fungible tokens, airdrops |
| Queries Plugin | Query account details, HBAR balances, token holdings, topic messages |

### 5.3 Third-Party DeFi Plugins

| Plugin | NPM Package | Version | Functions |
|--------|-------------|---------|-----------|
| SaucerSwap | `hak-saucerswap-plugin` | 1.0.1 | Swap quotes, execute swaps, pools, liquidity, farms |
| Bonzo Finance | `@bonzofinancelabs/hak-bonzo-plugin` | Latest | Deposit, withdraw, borrow, repay, market data, approve |
| Pyth Oracle | `hak-pyth-plugin` | 0.1.1 | List feeds, fetch latest prices |
| CoinCap | TBD | TBD | Market data |
| Chainlink | TBD | TBD | Price feeds |
| Memejob | TBD | TBD | Meme token operations |

### 5.4 Full Agent Setup with All DeFi Plugins

```typescript
import { Client, PrivateKey } from '@hashgraph/sdk';
import { HederaLangchainToolkit, AgentMode } from 'hedera-agent-kit';
import { saucerswapPlugin } from 'hak-saucerswap-plugin';
import { bonzoPlugin } from '@bonzofinancelabs/hak-bonzo-plugin';
import { pythPlugin } from 'hak-pyth-plugin';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const client = Client.forTestnet().setOperator(
  process.env.ACCOUNT_ID!,
  PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!)
);

const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [saucerswapPlugin, bonzoPlugin, pythPlugin],
    tools: [],
    context: { mode: AgentMode.AUTONOMOUS }
  }
});

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' });
const tools = toolkit.getTools();

// The agent now has access to ALL these tools:
// - saucerswap_get_swap_quote
// - saucerswap_swap_tokens
// - saucerswap_get_pools
// - saucerswap_add_liquidity
// - saucerswap_remove_liquidity
// - saucerswap_get_farms
// - bonzo_market_data_tool
// - approve_erc20_tool
// - bonzo_deposit_tool
// - bonzo_withdraw_tool
// - bonzo_borrow_tool
// - bonzo_repay_tool
// - pyth_list_feeds (or similar)
// - pyth_get_price (or similar)
// + all core Hedera tools (transfer, create tokens, HCS, etc.)
```

### 5.5 Execution Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `AgentMode.AUTONOMOUS` | Transactions execute immediately using the operator account | Automated agents |
| `AgentMode.RETURN_BYTES` (or `returnBytes`) | Returns serialized transaction bytes for external signing | Wallet-connected UIs, multi-sig |

---

## 6. Quick Reference Tables

### 6.1 Testnet JSON RPC Endpoints

| Service | URL |
|---------|-----|
| Hedera Testnet JSON RPC | `https://testnet.hashio.io/api` |
| Hedera Mainnet JSON RPC | `https://mainnet.hashio.io/api` |
| Mirror Node Testnet | `https://testnet.mirrornode.hedera.com` |
| Mirror Node Mainnet | `https://mainnet.mirrornode.hedera.com` |
| SaucerSwap API | `https://api.saucerswap.finance` |
| Bonzo Data API | `https://mainnet-data-staging.bonzo.finance/` |
| Pyth Hermes API | `https://hermes.pyth.network` |

### 6.2 Essential Testnet Token IDs

| Token | Testnet ID | Decimals |
|-------|-----------|----------|
| HBAR | Native | 8 |
| WHBAR | 0.0.15058 | 8 |
| SAUCE | 0.0.1183558 | 6 |
| xSAUCE | 0.0.1418651 | - |
| USDC | 0.0.5449 | 6 |
| HBARX | 0.0.2231533 | 8 |

### 6.3 Essential Testnet Contract Summary

| Protocol | Contract | Testnet ID |
|----------|----------|-----------|
| SaucerSwap | V1 Router | 0.0.19264 |
| SaucerSwap | V1 Factory | 0.0.9959 |
| SaucerSwap | V2 SwapRouter | 0.0.1414040 |
| SaucerSwap | V2 Factory | 0.0.1197038 |
| SaucerSwap | V2 QuoterV2 | 0.0.1390002 |
| SaucerSwap | WHBAR Contract | 0.0.15057 |
| Bonzo | LendingPool | 0.0.2664875 |
| Supra | Pull Contract | 0x6bf7b21145Cbd7BB0b9916E6eB24EDA8A675D7C0 |
| Supra | Storage (Push) | 0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917 |
| Pyth | Price Feed Contract | 0xa2aa501b19aff244d90cc15a4cf739d2725b5729 |

### 6.4 NPM Packages Summary

```bash
# Core
npm install hedera-agent-kit @hashgraph/sdk

# DeFi Plugins
npm install hak-saucerswap-plugin
npm install @bonzofinancelabs/hak-bonzo-plugin
npm install hak-pyth-plugin

# Development tools
npm install ethers@6 axios dotenv

# LangChain (for AI agent orchestration)
npm install @langchain/core langchain @langchain/langgraph @langchain/openai
```

### 6.5 What's Actually Deployable on Testnet RIGHT NOW

| Feature | Status | Ready? |
|---------|--------|--------|
| SaucerSwap V1 token swaps | Contracts deployed, API available | YES |
| SaucerSwap V2 token swaps | Contracts deployed | YES |
| SaucerSwap liquidity provision | Contracts deployed | YES |
| Bonzo lending/borrowing | LendingPool deployed, testnet app live | YES |
| Bonzo flash loans | Part of Aave v2 core | YES |
| Pyth price feeds | Contract deployed on testnet | YES |
| Supra price feeds (Pull) | Contract deployed on testnet | YES |
| Supra price feeds (Push) | Contract deployed on testnet | YES |
| Chainlink price feeds | Mainnet only (limited testnet) | MAINNET ONLY |
| HeliSwap swaps | Code available, no stable testnet addresses | LIMITED |
| Pangolin swaps | Unclear status | NO |
| HashPort bridging | Bridge only, not DEX | N/A |

---

## Sources

- [SaucerSwap Documentation](https://docs.saucerswap.finance/)
- [SaucerSwap Contract Deployments](https://docs.saucerswap.finance/developerx/contract-deployments)
- [SaucerSwap REST API](https://docs.saucerswap.finance/v/developer/rest-api)
- [SaucerSwap V1 Swap Quote](https://docs.saucerswap.finance/developer/saucerswap-v1/swap-operations/swap-quote)
- [SaucerSwap Testnet](https://testnet.saucerswap.finance/)
- [Bonzo Finance Documentation](https://docs.bonzo.finance/hub/)
- [Bonzo Finance Contract Deployments](https://docs.bonzo.finance/hub/developer/contract-deployments)
- [Bonzo Finance Testnet](https://docs.bonzo.finance/hub/get-started/bonzo-testnet)
- [Bonzo Finance Testnet Launch Blog](https://bonzo.finance/blog/now-live-public-testnet-of-bonzo-finance)
- [Bonzo Plugin GitHub](https://github.com/Bonzo-Labs/bonzoPlugin)
- [Bonzo Technical Deep-Dive](https://bonzo.finance/blog/technical-deep-dive-leveraging-hedera-token-service-hts-for-bonzo-lending-and-borrowing)
- [Hedera Agent Kit GitHub](https://github.com/hashgraph/hedera-agent-kit-js)
- [Hedera Agent Kit Docs](https://docs.hedera.com/hedera/open-source-solutions/ai-studio-on-hedera/hedera-ai-agent-kit)
- [Hedera Agent Kit Plugins](https://github.com/hashgraph/hedera-agent-kit-js/blob/main/docs/PLUGINS.md)
- [Deep Dive into Hedera Agent Kit](https://hedera.com/blog/deep-dive-into-the-hedera-agent-kit-plugins-tools-and-practical-workflows/)
- [hak-saucerswap-plugin GitHub](https://github.com/jmgomezl/hak-saucerswap-plugin)
- [Pyth on Hedera Docs](https://docs.hedera.com/hedera/open-source-solutions/oracle-networks/pyth-network-oracle)
- [Pyth Contract Addresses](https://docs.pyth.network/price-feeds/contract-addresses)
- [Pyth Hedera Tutorial](https://github.com/hedera-dev/tutorial-js-pyth-oracle-contract-pull)
- [Supra Oracles on Hedera](https://docs.hedera.com/hedera/open-source-solutions/oracle-networks/supra-oracles)
- [Supra Pull Oracle Networks](https://docs.supra.com/oracles/data-feeds/pull-oracle/networks)
- [Supra Push Tutorial](https://github.com/hedera-dev/tutorial-js-supra-oracle-contract-push)
- [Chainlink on Hedera](https://docs.hedera.com/hedera/open-source-solutions/oracle-networks/chainlink-oracles)
- [HBAR/USD Chainlink Feed](https://data.chain.link/feeds/hedera/hedera/hbar-usd)
- [USDC/USD Chainlink Feed](https://data.chain.link/feeds/hedera/hedera/usdc-usd)
- [HeliSwap Contracts GitHub](https://github.com/HeliSwap/HeliSwap-contracts)
- [Hedera DeFi Overview (Genfinity)](https://genfinity.io/2025/01/17/hedera-defi-2025/)
