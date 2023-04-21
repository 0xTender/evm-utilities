import { generate_events_schema } from './index';
import { readFileSync, writeFileSync } from 'fs';
import { get_contract } from '@0xtender/evm-helpers';

import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const home = __dirname;

const pathToFolder = `../examples`;

const OwnablePath = join(home, pathToFolder, 'Ownable.json');

const contracts: {
  address: string;
  abi: any;
  transactionHash: string;
  name: string;
}[] = [{ path: OwnablePath, name: 'Ownable' }].map((e) => {
  return { ...JSON.parse(readFileSync(e.path).toString()), name: e.name };
});

const main = async () => {
  const contract_metadata = contracts.map((contract) => {
    return {
      ...contract,
      instance: get_contract(contract.address, contract.abi),
    };
  });

  const rendered = await generate_events_schema(contract_metadata, 'postgres');

  writeFileSync(join(__dirname, '..', 'examples', 'postgres.prisma'), rendered);
  execSync('npm run dev:generate', {
    cwd: join(__dirname, '..'),
  });
};

main().catch(console.error);
