import { Contract, providers } from 'ethers';
import { get_latest_block } from '@0xtender/evm-helpers/src';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
export const add_contracts = async (prisma: any, contracts_arr: any[]) => {
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

const get_event_name_internal = (event_name: string, contract_name: string) => {
  return event_name.slice(2, event_name.length - contract_name.length - 1);
};

export const fetch_transactions_for_contract = async (
  contract: {
    name: string;
    address: string;
    chainId: number;
    abiPath: string;
  },
  events: string[],
  provider: providers.JsonRpcProvider,
  prisma: any,
  batchSize: number = 1000
) => {
  const contract_events = events.filter(
    (e) => e.startsWith(`e_`) && e.endsWith(`_${contract.name}`)
  );

  const contract_pm = await prisma.contract_pm.findFirstOrThrow({
    where: {
      address: contract.address,
      chainId: contract.chainId,
    },
  });

  const indexedTillBlock = contract_pm.indexedTillBlock;
  const latestBlock = await get_latest_block(provider);

  const contract_instance = new Contract(
    contract.address,
    JSON.parse(readFileSync(contract.abiPath).toString()).abi,
    provider
  );
  let currentIndexTill: number = indexedTillBlock;

  while (currentIndexTill < latestBlock) {
    if (latestBlock - currentIndexTill > batchSize) {
      currentIndexTill = currentIndexTill + batchSize;
    } else {
      currentIndexTill = latestBlock;
    }
    console.log({
      currentIndexTill,
      latestBlock,
      pendingBlocks: latestBlock - currentIndexTill,
    });

    const promises: Promise<any>[] = [];

    for (let index = 0; index < contract_events.length; index++) {
      promises.push(
        (async () => {
          const event_changed_name = contract_events[index];

          const event_name = get_event_name_internal(
            event_changed_name.trim(),
            contract.name
          );
          const event = Object.values(
            contract_instance.interface.events
          ).filter((e) => e.name === event_name)[0]!;
          const queryData = await contract_instance.queryFilter(
            contract_instance.filters[event_name](),
            indexedTillBlock,
            currentIndexTill
          );

          const to_save_args: {
            blockData: {
              block: number;
              transactionHash: string;
              logIndex: number;
            };
            data: any;
          }[] = [];
          for (let index = 0; index < queryData.length; index++) {
            const query = queryData[index];

            const arg_keys = event.inputs.map((e) => e.name);

            let arg_map = {};

            for (let index = 0; index < arg_keys.length; index++) {
              const arg_key = arg_keys[index];
              const arg = query.args?.[arg_key];
              const data = arg?.toString();
              arg_map = { ...arg_map, [`A_${arg_key}`]: data };
            }

            to_save_args.push({
              data: arg_map,
              blockData: {
                block: query.blockNumber,
                transactionHash: query.transactionHash,
                logIndex: query.logIndex,
              },
            });
          }
          const entry = to_save_args.map((e) => {
            const uuid = randomUUID() as string;
            return {
              id: uuid,
              event_entry: {
                id: uuid,
                ...e.blockData,
                ContractId: contract_pm.id,
              },
              data: { ...e.data, eventId: uuid },
            };
          });

          console.log(
            `Found events for ${event_changed_name}: ${queryData.length}`
          );
          const event_entry = entry.map((e) => e.event_entry);

          await prisma.event_pm.createMany({
            data: event_entry,
          });

          const event_entry_data = entry.map((e) => e.data);

          await prisma[event_changed_name].createMany({
            data: event_entry_data,
          });

          await prisma.contract_pm.update({
            where: {
              id: contract_pm.id,
            },
            data: {
              indexedTillBlock: currentIndexTill,
            },
          });
        })()
      );
    }

    await Promise.all(promises);
  }
};
