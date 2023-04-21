import { PrismaClient } from '@prisma/client';
import { providers } from 'ethers';
import {
  add_contracts,
  fetch_transactions_for_contract,
} from '@0xtender/evm-helpers/src';

const batchSize = 1000;

const prisma = new PrismaClient();

const events = [
  'e_Transfer_Avalanche',
  'e_Approval_Avalanche',
  'e_OrderFilledRFQ_RandomUniswap',
  'e_OwnershipTransferred_RandomUniswap',
  'e_Swapped_RandomUniswap',
];

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

const contracts_arr: {
  chainId: number;
  initBlock: number;
  name: string;
  address: string;
  transactionHash: string;
  abiPath: string;
}[] = [
  {
    chainId: 137,
    initBlock: 1,
    name: 'Avalanche',
    address: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
    transactionHash:
      '0xa6527d280cc8001c6417bafadf4ced4a3d619b6d7b968ed5d2792723d28a4f6a',
    abiPath:
      '/Users/aniketchowdhury/Experiments/evm-utilities/packages/events-schema-generator/examples/Avalanche.json',
  },
  {
    chainId: 137,
    initBlock: 1,
    name: 'RandomUniswap',
    address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    transactionHash:
      '0x3392761ef9a99a3b3b2b6c4eecd047ec82c602fbdea9da6ed2e1cd4bf87603d7',
    abiPath:
      '/Users/aniketchowdhury/Experiments/evm-utilities/packages/events-schema-generator/examples/RandomUniswap.json',
  },
];

const migrate = async () => {
  const added_contracts = await add_contracts(prisma, contracts_arr);

  for (let index = 0; index < contracts_arr.length; index++) {
    const contract = contracts_arr[index];
    await fetch_transactions_for_contract(
      contract,
      events,
      get_provider(contract.chainId),
      prisma,
      batchSize
    );
  }

  return added_contracts;
};

migrate().catch(console.error);
