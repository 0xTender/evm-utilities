import { join } from 'path';
import { get_events_list } from './index';
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

  const chainId = await get_chain_id(provider);

  const latestBlock = await get_latest_block(provider);

  const events = get_events_list(instance);

  const deploymentBlock = await get_block_from_tx_hash(
    contract.transactionHash,
    provider
  );

  console.log({ chainId, latestBlock, events, deploymentBlock });
};

main().catch(console.error);
