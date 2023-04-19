import { generate_events_schema } from './index';
import { readFileSync, writeFileSync } from 'fs';
import { get_contract, get_json_rpc_provider } from '@evm-utilities/helpers';

import { join } from 'path';
import { homedir } from 'os';

const home = homedir();

const pathToFolder = `Experiments/armoury/packages/core/deployments/localhost`;

const AccessControlPath = `${home}/${pathToFolder}/AccessControl.json`;
const ActorFactoryPath = `${home}/${pathToFolder}/ActorFactory.json`;
const CandyPath = `${home}/${pathToFolder}/Candy.json`;
const RegistryPath = `${home}/${pathToFolder}/Registry.json`;

const contracts: {
  address: string;
  abi: any;
  transactionHash: string;
  name: string;
}[] = [
  { path: AccessControlPath, name: 'AccessControl' },
  { path: CandyPath, name: 'Candy' },
  { path: ActorFactoryPath, name: 'ActorFactory' },
  { path: RegistryPath, name: 'Registry' },
].map((e) => {
  return { ...JSON.parse(readFileSync(e.path).toString()), name: e.name };
});

const main = async () => {
  const provider = get_json_rpc_provider('http://127.0.0.1:8545');

  const contract_name = 'Candy';

  const contract_metadata = contracts.map((contract) => {
    return {
      ...contract,
      instance: get_contract(contract.address, contract.abi, provider),
    };
  });

  const rendered = await generate_events_schema(contract_metadata, 'postgres');

  writeFileSync(join(__dirname, '..', 'examples', 'postgres.prisma'), rendered);
};

main().catch(console.error);
