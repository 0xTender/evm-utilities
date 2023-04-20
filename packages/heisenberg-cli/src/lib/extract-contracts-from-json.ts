import { get_json_rpc_provider, get_contract } from '@0xtender/evm-helpers';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { z } from 'zod';

export const extract_contract_from_json = (
  contracts_json: string = './contracts.json'
) => {
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
    const contract = contracts_parsed[index]!;

    const provider = get_json_rpc_provider(contract.rpc);

    const data: {
      address: string;
      abi: any;
      transactionHash: string;
    } = JSON.parse(readFileSync(contract.path).toString());
    contracts.push({
      ...contract,
      data: {
        ...data,
        provider,
        instance: get_contract(data.address, data.abi),
        name: contract.name,
      },
    });
  }
};
