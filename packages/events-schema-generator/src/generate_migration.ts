import { Contract } from 'ethers';
import { renderer, renderers } from './renderer';
import { get_contract_metadata, PromiseType } from '@0xtender/evm-helpers';

export const generate_migration = async <T extends Contract>(
  contracts: {
    instance: T;
    transactionHash: string;
    name: string;
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
        contract.name
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
  console.log(events);

  const rendered = await renderer(extension_name, 'migration', {
    events,
  });

  return rendered;
};
