import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const add_contracts = async () => {
  const contracts = await prisma.contract.count();
};
