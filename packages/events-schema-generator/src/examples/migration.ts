import { PrismaClient } from '@prisma/client';
import { providers } from 'ethers';
import {
  add_contracts,
  fetch_transactions_for_contract,
  MigrationEventTypes,
  MigrationListener,
} from '@0xtender/evm-helpers';

const batchSize = 1;

const prisma = new PrismaClient();

const events = [
  'e_Transfer_Avalanche',
  'e_Approval_Avalanche',
  'e_OrderFilledRFQ_RandomUniswap',
  'e_OwnershipTransferred_RandomUniswap',
  'e_Swapped_RandomUniswap',
  'e_Approval_WETH',
  'e_MetaTransactionExecuted_WETH',
  'e_RoleAdminChanged_WETH',
  'e_RoleGranted_WETH',
  'e_RoleRevoked_WETH',
  'e_Transfer_WETH',
];

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
    initBlock: 41788917,
    name: 'Avalanche',
    address: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
    transactionHash:
      '0xa6527d280cc8001c6417bafadf4ced4a3d619b6d7b968ed5d2792723d28a4f6a',
    abiPath:
      '/Users/aniketchowdhury/Experiments/evm-utilities/packages/events-schema-generator/src/examples/Avalanche.json',
  },
  {
    chainId: 137,
    initBlock: 41790805,
    name: 'RandomUniswap',
    address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    transactionHash:
      '0x3392761ef9a99a3b3b2b6c4eecd047ec82c602fbdea9da6ed2e1cd4bf87603d7',
    abiPath:
      '/Users/aniketchowdhury/Experiments/evm-utilities/packages/events-schema-generator/src/examples/RandomUniswap.json',
  },
  {
    chainId: 137,
    initBlock: 41788917,
    name: 'WETH',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    transactionHash:
      '0xa6527d280cc8001c6417bafadf4ced4a3d619b6d7b968ed5d2792723d28a4f6a',
    abiPath:
      '/Users/aniketchowdhury/Experiments/evm-utilities/packages/events-schema-generator/src/examples/WETH.json',
  },
];

class Placeholder {
  private static _eventEmitter:
    | MigrationListener<MigrationEventTypes>
    | undefined;
  public static get eventEmitter():
    | MigrationListener<MigrationEventTypes>
    | undefined {
    return Placeholder._eventEmitter;
  }
  public static set eventEmitter(
    value: MigrationListener<MigrationEventTypes> | undefined
  ) {
    if (!Placeholder._eventEmitter) {
      Placeholder._eventEmitter = value;
    }
  }
}

const run = async () => {
  await add_contracts(prisma, contracts_arr);
  const promises: Promise<any>[] = [];

  for (let index = 0; index < contracts_arr.length; index++) {
    const contract = contracts_arr[index]!;
    promises.push(
      (async () => {
        try {
          await fetch_transactions_for_contract(
            contract,
            events,
            get_provider(contract.chainId),
            prisma,
            batchSize,
            Placeholder.eventEmitter
          );
        } catch (err) {
          console.error(err);
          console.log(`Running failed transaction again in 5 seconds...`);

          await new Promise((resolve) => {
            setTimeout(async () => {
              await run();
              resolve({});
            }, 5_000);
          });
        }
      })()
    );
  }

  await Promise.all(promises);

  console.log(`Running again... in 10_000 miliseconds...`);
  setTimeout(async () => {
    await run();
  }, 10_000);
};

export const migrate = async <T extends MigrationEventTypes>(
  emitter?: MigrationListener<T>
) => {
  Placeholder.eventEmitter = emitter;

  const chains = Array.from(new Set(contracts_arr.map((e) => e.chainId)));
  for (let index = 0; index < chains.length; index++) {
    const chainId = chains[index];
    try {
      console.log('provider ready');
      await get_provider(chainId).ready;
    } catch (err) {
      console.error(err);
    }
  }

  await run();
};

const emitter = new MigrationListener<MigrationEventTypes>();
emitter.on('event_data', async (...data) => {
  for (let index = 0; index < data.length; index++) {
    const events = data[index];
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      console.log({ event });
    }
  }
});

migrate(emitter).catch(console.error);
