import { Contract } from 'ethers';

export const get_events_list = <T extends Contract>(contract: T) => {
  return Object.keys(contract.filters);
};
