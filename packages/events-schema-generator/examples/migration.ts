import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
const prisma = new PrismaClient();

const contracts_arr = [
  {
    chainId: 137,
    initBlock: 41788917,
    name: 'Ownable',
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    transactionHash:
      '0xaf182a1de82819838ebce3104fdd93e87c3ad0c946c9e4844faf16f17cea15cf',
  },
];

const add_contracts = async () => {
  const contracts = await prisma.contract_pm.count();

  if (contracts < contracts_arr.length) {
    const pending_contracts = await Promise.all(
      contracts_arr
        .map((contract) => ({
          ...contract,
          indexedTillBlock: contract.initBlock,
        }))
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
      data: await Promise.all(pending_contracts),
    });

    return pending_contracts;
  }
  return [];
};

const migrate = async () => {
  const added_contracts = await add_contracts();

  return added_contracts;
};

migrate().then(console.log).catch(console.error);
