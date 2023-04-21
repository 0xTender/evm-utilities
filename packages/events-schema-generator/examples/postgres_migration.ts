import { PrismaClient } from '@prisma/client';
import { Contract, providers } from 'ethers';
import { resolve } from 'path';
import { get_latest_block } from '../../evm-helpers/src';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const batchSize = 1000;

const prisma = new PrismaClient();

const events = [
    "e_Transfer_Avalanche",
    "e_Approval_Avalanche",
    "e_OrderFilledRFQ_RandomUniswap",
    "e_OwnershipTransferred_RandomUniswap",
    "e_Swapped_RandomUniswap",
]

const get_event_name = (event_name: string, contract_name: string) => {
  return event_name.slice(2, event_name.length - contract_name.length - 1);
};

const map = new Map<number, providers.JsonRpcProvider>();

const get_provider = (chainId: number | string) => {
  let provider = map.get(parseInt(chainId.toString()));
  if (provider) {
    return provider;
  }
  provider = new providers.JsonRpcProvider(process.env[`RPC_${chainId}_CHAIN`]);
  map.set(parseInt(chainId.toString()), provider);
  return provider;
};
