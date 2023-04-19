import { Contract, providers } from 'ethers';
import { EventFragment } from 'ethers/lib/utils';
import { get_chain_id, get_latest_block } from '@evm-utilities/helpers';

export const get_events = <T extends Contract>(contract: T) => {
  return contract.interface.events;
};

export const get_events_list = <T extends Contract>(contract: T) => {
  return Object.keys(contract.interface.events);
};

export const sanitize_event = (event: EventFragment) => {
  return {
    name: event.name,
    inputs: event.inputs.map((input) => ({
      name: input.name,
      type: input.type,
    })),
  };
};

export const get_contract_metadata = async <T extends Contract>(
  contract: T,
  transactionHash: string
) => {
  const provider = contract.provider;
  const events = Object.entries(get_events(contract))
    .map((e) => e[1])
    .map(sanitize_event);

  const chainId = await get_chain_id(provider);

  const latestBlock = await get_latest_block(provider);

  return { events, chainId, latestBlock, transactionHash };
};
