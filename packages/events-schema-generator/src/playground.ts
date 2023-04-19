import {
  get_contract_metadata,
  generate_single_events_schema,
  generate_events_schema,
} from './index';
import { readFileSync, writeFileSync } from 'fs';
import { get_contract, get_json_rpc_provider } from '@evm-utilities/helpers';

import { join } from 'path';

const AccessControlPath =
  '/Users/aniketchowdhury/Experiments/armoury/packages/core/deployments/localhost/AccessControl.json';
const ActorFactoryPath =
  '/Users/aniketchowdhury/Experiments/armoury/packages/core/deployments/localhost/ActorFactory.json';
const CandyPath =
  '/Users/aniketchowdhury/Experiments/armoury/packages/core/deployments/localhost/Candy.json';
const RegistryPath =
  '/Users/aniketchowdhury/Experiments/armoury/packages/core/deployments/localhost/Registry.json';

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

  // for (let index = 0; index < contracts.length; index++) {
  //   const contract = contracts[index];
  //   const instance =
  // }
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
