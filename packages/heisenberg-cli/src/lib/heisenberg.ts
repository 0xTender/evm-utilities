#!/usr/bin/env ts-node
import { get_json_rpc_provider } from '@0xtender/helpers';
import { Command } from 'commander';

import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';

import { z } from 'zod';

const program = new Command();

const version = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json')).toString()
).version;

program.name('heisenberg').description('Heisenberg CLI').version(version);

program
  .command('generate')
  .description("Generate contract events' schema")
  .argument('<contracts.json>', 'contracts to generate schema for')
  .action((contracts_json, options) => {
    contracts_json = resolve(contracts_json);

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

      contracts.push({
        ...contract,
        data: {
          ...JSON.parse(readFileSync(contract.path).toString()),
          provider,
        },
      });
    }

    console.log(contracts);
  });
program.parse();
