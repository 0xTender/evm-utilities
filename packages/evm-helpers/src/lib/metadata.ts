import { Contract } from 'ethers';
import { EventFragment } from 'ethers/lib/utils';
import { get_chain_id, get_latest_block } from '@0xtender/evm-helpers';
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
  transactionHash: string,
  contractName: string,
  strict = false
) => {
  const provider = contract.provider;
  const events = Object.entries(get_events(contract))
    .map((e) => e[1])
    .map(sanitize_event);
  let chainId: number = -1;
  let latestBlock: number = -1;
  if (provider) {
    chainId = await get_chain_id(provider);
    latestBlock = await get_latest_block(provider);
  } else {
    console.warn(
      `[WARN]: No provider found for contract or unavailable network: ${contractName}`
    );
    if (strict === true) {
      throw new Error(`No provider found for contract ${contractName}`);
    }
  }

  return {
    events,
    chainId,
    latestBlock,
    transactionHash,
    contractName,
    contract,
  };
};
