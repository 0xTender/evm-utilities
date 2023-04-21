import { generate_events_schema } from './index';
import { readFileSync, writeFileSync } from 'fs';
import { get_contract, get_latest_block } from '@0xtender/evm-helpers';

import { join } from 'path';
import { execSync } from 'child_process';
import { providers } from 'ethers';

const home = __dirname;
const pathToFolder = `../examples`;

const contracts_arr: {
  path: string;
  name: string;
  rpc: string;
}[] = JSON.parse(
  readFileSync(join(__dirname, '..', 'examples/contracts.json')).toString()
).map((obj: any) => {
  return { ...obj, path: join(home, pathToFolder, obj.path) };
});

const contracts: {
  address: string;
  abi: any;
  transactionHash: string;
  name: string;
  rpc: string;
}[] = contracts_arr.map((e) => {
  return { ...e, ...JSON.parse(readFileSync(e.path).toString()), name: e.name };
});

const main = async () => {
  const contract_metadata = await Promise.all(
    contracts.map(async (contract) => {
      try {
        const provider = new providers.JsonRpcProvider(contract.rpc);

        const block = await get_latest_block(provider);
        return {
          ...contract,
          instance: get_contract(contract.address, contract.abi, provider),
        };
      } catch (err) {
        console.error('Error in contract init', err);
        throw err;
      }
    })
  );

  const rendered = await generate_events_schema(contract_metadata, 'postgres');

  writeFileSync(join(__dirname, '..', 'examples', 'postgres.prisma'), rendered);
  const logs = execSync('npm run dev:generate', {
    cwd: join(__dirname, '..'),
  });
  console.log(logs.toString());
};

main().catch(console.error);
