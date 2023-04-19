import { get_contract_metadata, generate_events_schema } from './index';
import { readFileSync, writeFileSync } from 'fs';
import { get_contract, get_json_rpc_provider } from '@evm-utilities/helpers';

import { Liquid } from 'liquidjs';
import { join } from 'path';

const contract: {
  address: string;
  abi: any;
  transactionHash: string;
} = JSON.parse(
  readFileSync(
    '/Users/aniketchowdhury/Experiments/armoury/packages/core/deployments/localhost/Candy.json'
  ).toString()
);

const main = async () => {
  const provider = get_json_rpc_provider('http://127.0.0.1:8545');

  const contract_name = 'Candy';

  const instance = get_contract(contract.address, contract.abi, provider);

  const metadata = await get_contract_metadata(
    instance,
    contract.transactionHash,
    contract_name
  );
  writeFileSync(
    join(__dirname, 'output', 'postgres.prisma'),
    await generate_events_schema(metadata, 'postgres')
  );
};

main().catch(console.error);
