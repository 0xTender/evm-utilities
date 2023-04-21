import { Contract, providers } from 'ethers';
import { renderer, renderers } from './renderer';
import {
  get_block_from_tx_hash,
  get_contract_metadata,
  PromiseType,
} from '@0xtender/evm-helpers';

export const generate_migration = async <T extends Contract>(
  contracts: {
    instance: T;
    transactionHash: string;
    name: string;
    abiPath: string;
  }[],
  extension_name: keyof typeof renderers
) => {
  const metadata: PromiseType<ReturnType<typeof get_contract_metadata>>[] = [];
  for (let index = 0; index < contracts.length; index++) {
    const contract = contracts[index];
    metadata.push(
      await get_contract_metadata(
        contract.instance,
        contract.transactionHash,
        contract.name,
        contract.abiPath
      )
    );
  }
  const events = [];

  for (let index = 0; index < metadata.length; index++) {
    const contract_metadata = metadata[index];

    events.push(
      ...contract_metadata.events.map((e) => ({
        ...e,
        contract_name: contract_metadata.contractName,
      }))
    );
  }

  const rendered = await renderer(extension_name, 'migration', {
    events,
    contracts: (
      await Promise.all(
        metadata.map(async (e) => {
          const provider = e.provider as providers.JsonRpcProvider;
          const initBlock = await get_block_from_tx_hash(
            e.transactionHash,
            provider
          );
          return {
            chainId: e.chainId,
            initBlock,
            name: e.contractName,
            address: e.address,
            transactionHash: e.transactionHash,
            abiPath: e.abiPath,
          };
        })
      )
    ).map((e) => JSON.stringify(e, undefined, 4)),
  });

  return rendered;
};
