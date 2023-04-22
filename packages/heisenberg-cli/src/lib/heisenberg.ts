#!/usr/bin/env ts-node
import {
  get_contract,
  get_contract_metadata,
  get_json_rpc_provider,
} from '@0xtender/evm-helpers';
import { generate_events_schema } from '@0xtender/events-schema-generator';
import { Command } from 'commander';

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

import { z } from 'zod';
import { providers } from 'ethers';
import { generate_migration } from '../../../events-schema-generator/src/generate_migration';

const program = new Command();

const version = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json')).toString()
).version;

program.name('heisenberg').description('Heisenberg CLI').version(version);

program
  .command('generate')
  .description("Generate contract events' schema")
  .argument('<contracts.json>', 'contracts to generate schema for')
  .option(
    '-i, --input-file <input_file>',
    'base input file for the schema (optional)'
  )
  .requiredOption(
    '-o, --output-file <output_file>',
    'output file for the schema'
  )
  .action(
    async (
      contracts_json: string,
      options: { outputFile: string; inputFile?: string }
    ) => {
      let template: undefined | string = undefined;

      if (options.inputFile) {
        template = readFileSync(options.inputFile).toString();
      }

      contracts_json = resolve(contracts_json);

      const contracts = get_contracts(contracts_json);

      const rendered = await generate_events_schema(
        contracts.map((c) => c.data),
        'postgres',
        template
      );

      console.log(`Writing to ${resolve(options.outputFile)}`);
      writeFileSync(options.outputFile, rendered);
    }
  );

program
  .command('generate-migration')
  .description('Generate migration script')
  .argument('<contracts.json>', 'contracts to generate migration for')
  .option(
    '-i, --input-file <input_file>',
    'base input file for the migration (optional)'
  )
  .requiredOption(
    '-o, --output-file <output_file>',
    'output file for the migration'
  )
  .action(async (contracts_json: string, options: { outputFile: string }) => {
    const contracts = get_contracts(contracts_json).map((c) => ({
      ...c,
      ...c.data,
    }));

    const migration_script = await generate_migration(contracts, 'postgres');
    console.log(`Writing to ${resolve(options.outputFile)}`);
    writeFileSync(options.outputFile, migration_script);
  });

program.parse();

function get_contracts(contracts_json: string) {
  const contracts_arr = JSON.parse(readFileSync(contracts_json).toString());

  const schema = z.array(
    z.object({
      path: z.string(),
      name: z.string(),
      rpc: z.string(),
    })
  );

  const contracts_parsed = schema.parse(contracts_arr).map((contract) => {
    // try absolute path first
    let contract_path = resolve(contract.path);

    if (existsSync(resolve(contract.path))) {
      return {
        ...contract,
        path: contract_path,
      };
    }

    // try relative path to contracts.json
    contract_path = join(dirname(contracts_json), contract.path);

    if (existsSync(contract_path)) {
      return {
        ...contract,
        path: contract_path,
      };
    }

    throw new Error(`Contract ${contract.path} not found`);
  });

  const contracts = [];

  for (let index = 0; index < contracts_parsed.length; index++) {
    const contract = contracts_parsed[index];

    const provider = get_json_rpc_provider(contract.rpc);
    const data: {
      address: string;
      abi: any;
      transactionHash: string;
    } = JSON.parse(readFileSync(contract.path).toString());
    const instance = get_contract(data.address, data.abi, provider);
    contracts.push({
      ...contract,
      data: {
        ...data,
        provider,
        instance: instance,
        name: contract.name,
        abiPath: contract.path,
      },
    });
  }
  return contracts;
}
