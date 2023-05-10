import { Contract, providers } from 'ethers';

export const get_chain_id = async (provider: providers.Provider) => {
  const network = await provider.getNetwork();
  return Number(network.chainId);
};

export const get_latest_block = async (provider: providers.Provider) => {
  return await provider.getBlockNumber();
};

export const get_json_rpc_provider = (rpcURL: string) => {
  return new providers.JsonRpcProvider(rpcURL);
};

export const get_block_from_tx_hash = async (
  txHash: string,
  provider: providers.Provider
) => {
  const tx = await provider.getTransaction(txHash);
  if (!tx || !tx.blockNumber)
    throw new Error(`Transaction not found: ${txHash}`);
  return tx.blockNumber;
};

export const get_contract = <T extends Contract>(
  address: string,
  abi: any,
  provider?: providers.Provider
) => {
  return new Contract(address, abi, provider) as T;
};
