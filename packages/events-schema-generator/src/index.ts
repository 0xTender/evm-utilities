import { Contract, providers } from 'ethers';
import { EventFragment } from 'ethers/lib/utils';
import { get_chain_id, get_latest_block } from '@evm-utilities/helpers';
import { PromiseType } from '../../helpers/src/lib/types';
import { join } from 'path';
import { extensions } from './extensions';
import { readFileSync } from 'fs';
import { Liquid } from 'liquidjs';

export const get_events = <T extends Contract>(contract: T) => {
  return contract.interface.events;
};

export const get_events_list = <T extends Contract>(contract: T) => {
  return Object.keys(contract.interface.events);
};

export const sanitize_event = (event: EventFragment) => {
  return {
    name: event.name,
    inputs: event.inputs.map((input) => ({
      name: input.name,
      type: input.type,
    })),
  };
};

export const get_contract_metadata = async <T extends Contract>(
  contract: T,
  transactionHash: string,
  contractName: string
) => {
  const provider = contract.provider;
  const events = Object.entries(get_events(contract))
    .map((e) => e[1])
    .map(sanitize_event);

  const chainId = await get_chain_id(provider);

  const latestBlock = await get_latest_block(provider);

  return {
    events,
    chainId,
    latestBlock,
    transactionHash,
    contractName,
    contract,
  };
};

export const generate_events_schema = async (
  metadata: PromiseType<ReturnType<typeof get_contract_metadata>>,
  extension_name: keyof typeof extensions
) => {
  const extension = extensions[extension_name];
  const templatePath = join(__dirname, 'templates', extension.file_name);

  const template = readFileSync(templatePath).toString();

  if (!template) throw new Error('Template not found');

  const engine_type = extension.engine;

  if (engine_type === 'liquid') {
    const init_template = `
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

    const engine = new Liquid();
    const rendered = await engine.parseAndRender(init_template + template, {
      contract_name: `${metadata.contractName}`,
      events: metadata.events,
    });

    return rendered;
  }
  throw new Error('Engine not supported');
};
