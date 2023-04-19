import {
  get_events_list,
  sanitize_event,
  get_contract_metadata,
} from './index';
import { readFileSync } from 'fs';
import {
  get_chain_id,
  get_contract,
  get_json_rpc_provider,
  get_latest_block,
} from '@evm-utilities/helpers';
import { get_block_from_tx_hash } from '../../helpers/src/lib/contract';

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

  const instance = get_contract(contract.address, contract.abi, provider);

  const metadata = await get_contract_metadata(
    instance,
    contract.transactionHash
  );
  console.log(metadata);
};

main().catch(console.error);
