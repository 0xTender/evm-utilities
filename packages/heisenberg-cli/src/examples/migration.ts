import { PrismaClient } from '@prisma/client';
import { providers } from 'ethers';
import {
  PromiseType,
  add_contracts,
  fetch_transactions_for_contract,
} from '@0xtender/evm-helpers';
import { EventEmitter } from 'events';

const batchSize = 1000;

const prisma = new PrismaClient();

const events = ['e_Transfer_Avalanche', 'e_Approval_Avalanche'];

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
    abiPath: 'packages/heisenberg-cli/examples/Avalanche.json',
  },
];

type EventTypes = {
  event_data: PromiseType<ReturnType<typeof fetch_transactions_for_contract>>;
};

export class MigrationListener<T extends EventTypes> {
  private _eventEmitter: EventEmitter = new EventEmitter();

  emit<EventName extends keyof T>(
    eventName: EventName,
    eventArg: T[EventName]
  ) {
    this._eventEmitter.emit(eventName.toString(), ...(eventArg as []));
  }

  on<EventName extends keyof T>(
    eventName: EventName,
    handler: (eventArg: T[EventName]) => void
  ) {
    this._eventEmitter.on(eventName.toString(), handler as any);
  }

  off<EventName extends keyof T>(
    eventName: EventName,
    handler: (eventArg: T[EventName]) => void
  ) {
    this._eventEmitter.off(eventName.toString(), handler as any);
  }
}

class Placeholder {
  private static _eventEmitter: MigrationListener<EventTypes> | undefined;
  public static get eventEmitter(): MigrationListener<EventTypes> | undefined {
    return Placeholder._eventEmitter;
  }
  public static set eventEmitter(
    value: MigrationListener<EventTypes> | undefined
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
          const data = await fetch_transactions_for_contract(
            contract,
            events,
            get_provider(contract.chainId),
            prisma,
            batchSize
          );
          if (Placeholder.eventEmitter) {
            Placeholder.eventEmitter.emit('event_data', data);
          }
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

  console.log(`Running again... in 10_000 milliseconds...`);
  setTimeout(async () => {
    await run();
  }, 10_000);
};

export const migrate = async <T extends EventTypes>(
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
