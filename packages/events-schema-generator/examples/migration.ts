import { Contract_pm, PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { resolve } from 'path';
const prisma = new PrismaClient();

const events = ['E_Approval_Avalanche', 'E_Transfer_Avalanche'];

const get_rpc = (chainId: number | string) => {
  return process.env[`RPC_${chainId}_CHAIN`];
};

const contracts_arr = [
  {
    chainId: 137,
    initBlock: 41788917,
    name: 'Avalanche',
    address: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
    transactionHash:
      '0xa6527d280cc8001c6417bafadf4ced4a3d619b6d7b968ed5d2792723d28a4f6a',
    abiPath: resolve(__dirname, 'Avalanche.json'),
  },
];

const add_contracts = async () => {
  const contracts = await prisma.contract_pm.count();

  if (contracts < contracts_arr.length) {
    const pending_contracts = await Promise.all(
      contracts_arr
        .map((contract) => {
          return { ...contract, indexedTillBlock: contract.initBlock };
        })
        .filter(async (contract) => {
          const find = await prisma.contract_pm.findFirst({
            where: {
              address: contract.address,
              chainId: contract.chainId,
            },
          });

          if (find === null) {
            return true;
          }
          return false;
        })
    );
    await prisma.contract_pm.createMany({
      data: (
        await Promise.all(pending_contracts)
      ).map((e) => {
        return e;
      }),
    });

    return pending_contracts;
  }
  return [];
};

const fetch_transactions_for_contract = async (contract: { name: string }) => {
  const contract_events = events.filter(
    (e) => e.startsWith(`E_`) && e.endsWith(`_${contract.name}`)
  );

  console.log(contract_events);
};

const migrate = async () => {
  const added_contracts = await add_contracts();

  if (added_contracts[0]) {
    await fetch_transactions_for_contract(added_contracts[0]);
  }
  return added_contracts;
};

migrate().then(console.log).catch(console.error);
