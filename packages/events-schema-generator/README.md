# events-schema-generator

Generate prisma schema from contracts.

```ts
const provider = get_json_rpc_provider('http://127.0.0.1:8545');

const contract_metadata: {
  instance: Contract;
  address: string;
  abi: any;
  transactionHash: string;
  name: string;
}[] = contracts.map((contract) => {
  return {
    ...contract,
    instance: get_contract(contract.address, contract.abi, provider),
  };
});

const rendered_schema = await generate_events_schema(
  contract_metadata,
  'postgres'
);
```
