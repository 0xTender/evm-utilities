import { Contract } from 'ethers';
import { get_contract_metadata, PromiseType } from '@0xtender/evm-helpers';
import { renderer, renderers } from './renderer';

export const generate_events_schema = async <T extends Contract>(
  contracts: {
    instance: T;
    transactionHash: string;
    name: string;
    abiPath: string;
  }[],
  extension_name: keyof typeof renderers,
  init_template?: string
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

  init_template ??= `
generator client {
  provider        = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
`;

  let template = init_template;

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

  const rendered = await renderer(extension_name, 'file_name', {
    events: events,
  });
  template += rendered;

  return template;
};
