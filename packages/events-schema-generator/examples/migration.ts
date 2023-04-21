import { Contract_pm, PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { Contract, providers } from 'ethers';
import { resolve } from 'path';
import { get_latest_block } from '../../evm-helpers/src';
import { readFileSync } from 'fs';
const prisma = new PrismaClient();

const events = [
  'e_Approval_Avalanche',
  'e_Transfer_Avalanche',
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

const contracts_arr = [
  {
    chainId: 137,
    initBlock: 41788917,
    name: 'Avalanche',
    address: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
    transactionHash:
      '0xa6527d280cc8001c6417bafadf4ced4a3d619b6d7b968ed5d2792723d28a4f6a',
    abiPath: resolve(__dirname, 'Avalanche.json'),
  },
  {
    chainId: 137,
    initBlock: 41790805,
    address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    transactionHash:
      '0x3392761ef9a99a3b3b2b6c4eecd047ec82c602fbdea9da6ed2e1cd4bf87603d7',
    name: 'RandomUniswap',
    abiPath: resolve(__dirname, 'RandomUniswap.json'),
  },
];

const add_contracts = async () => {
  const contracts = await prisma.contract_pm.count();

  if (contracts < contracts_arr.length) {
    const pending_contracts = await Promise.all(
      contracts_arr
        .map((contract) => {
          return { ...contract, indexedTillBlock: contract.initBlock };
        })
        .filter(async (contract) => {
          const find = await prisma.contract_pm.findFirst({
            where: {
              address: contract.address,
              chainId: contract.chainId,
            },
          });

          if (find === null) {
            return true;
          }
          return false;
        })
    );
    await prisma.contract_pm.createMany({
      data: (
        await Promise.all(pending_contracts)
      ).map((e) => {
        return e;
      }),
    });

    return pending_contracts;
  }
  return [];
};

export const fetch_transactions_for_contract = async (contract: {
  name: string;
  address: string;
  chainId: number;
  abiPath: string;
}) => {
  const contract_events = events.filter(
    (e) => e.startsWith(`e_`) && e.endsWith(`_${contract.name}`)
  );

  const provider = get_provider(contract.chainId);

  let latestBlock = await get_latest_block(provider);

  const contract_data = await prisma.contract_pm.findFirstOrThrow({
    where: {
      address: contract.address,
      chainId: contract.chainId,
    },
  });

  const indexedTillBlock = contract_data.indexedTillBlock;

  if (latestBlock - indexedTillBlock > 200) {
    latestBlock = indexedTillBlock + 200;
  }

  const contract_instance = new Contract(
    contract.address,
    JSON.parse(readFileSync(contract.abiPath).toString()).abi,
    provider
  );

  for (let index = 0; index < contract_events.length; index++) {
    const event = contract_events[index];

    const event_name = get_event_name(event.trim(), contract.name);
    console.log(event_name);
    const queryData = await contract_instance.queryFilter(
      contract_instance.filters[event_name](),
      indexedTillBlock,
      latestBlock
    );
    for (let index = 0; index < queryData.length; index++) {
      const query = queryData[index];
      console.log(query);
      break;
    }
  }
};

const migrate = async () => {
  const added_contracts = await add_contracts();

  for (let index = 0; index < contracts_arr.length; index++) {
    const contract = contracts_arr[index];
    await fetch_transactions_for_contract(contract);
  }

  return added_contracts;
};

migrate().catch(console.error);
