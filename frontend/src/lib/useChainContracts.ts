"use client";

import { useAccount } from "wagmi";
import {
  getContractsForChain,
  getChainMeta,
  isHederaChain,
  DEFAULT_CHAIN_ID,
  type ChainContracts,
  type ChainMeta,
} from "./contracts";

/**
 * React hook that returns the contract addresses, chain metadata,
 * and helper booleans for the currently connected chain.
 *
 * Falls back to ADI Testnet (99999) when wallet is not connected.
 */
export function useChainContracts(): {
  contracts: ChainContracts;
  chainMeta: ChainMeta;
  chainId: number;
  isHedera: boolean;
} {
  const { chain } = useAccount();
  const chainId = chain?.id ?? DEFAULT_CHAIN_ID;

  return {
    contracts: getContractsForChain(chainId),
    chainMeta: getChainMeta(chainId),
    chainId,
    isHedera: isHederaChain(chainId),
  };
}
