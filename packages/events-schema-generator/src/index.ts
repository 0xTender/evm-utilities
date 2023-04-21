import { Contract } from 'ethers';
import { EventFragment } from 'ethers/lib/utils';
import {
  get_chain_id,
  get_latest_block,
  PromiseType,
} from '@0xtender/evm-helpers';
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
  contractName: string,
  strict = false
) => {
  const provider = contract.provider;
  const events = Object.entries(get_events(contract))
    .map((e) => e[1])
    .map(sanitize_event);
  let chainId: number = -1;
  let latestBlock: number = -1;
  if (provider) {
    chainId = await get_chain_id(provider);
    latestBlock = await get_latest_block(provider);
  } else {
    console.warn(
      `[WARN]: No provider found for contract or unavailable network: ${contractName}`
    );
    if (strict === true) {
      throw new Error(`No provider found for contract ${contractName}`);
    }
  }

  return {
    events,
    chainId,
    latestBlock,
    transactionHash,
    contractName,
    contract,
  };
};

export const generate_single_events_schema = async (
  metadata: PromiseType<ReturnType<typeof get_contract_metadata>>,
  extension_name: keyof typeof extensions
) => {
  const extension = extensions[extension_name];
  const templatePath = join(__dirname, 'templates', extension.file_name);

  const template = readFileSync(templatePath).toString();

  if (!template) throw new Error('Template not found');

  const engine_type = extension.engine;

  if (engine_type === 'liquid') {
    const engine = new Liquid();
    const rendered = await engine.parseAndRender(template, {
      events: metadata.events,
    });

    return rendered;
  }
  throw new Error('Engine not supported');
};

export const renderer = async (
  extension_name: keyof typeof extensions,
  template_key: 'base_file_name' | 'file_name',
  data: any = {}
) => {
  const extension = extensions[extension_name];
  const templatePath = join(__dirname, 'templates', extension[template_key]);

  const template = readFileSync(templatePath).toString();

  if (!template) throw new Error('Template not found');

  const engine_type = extension.engine;

  if (engine_type === 'liquid') {
    const engine = new Liquid();
    const rendered = await engine.parseAndRender(template, data);

    return rendered as string;
  }
  throw new Error('Engine not supported');
};

export const generate_events_schema = async <T extends Contract>(
  contracts: {
    instance: T;
    transactionHash: string;
    name: string;
  }[],
  extension_name: keyof typeof extensions,
  init_template?: string
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

  const rendered = await renderer('postgres', 'file_name', {
    events: events,
  });
  template += rendered;

  return template;
};
