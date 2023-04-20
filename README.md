# EVM Utilities for 0xTender

## Packages

- [0xtender/evm-helpers](packages/evm-helpers/README.md) - A set of helpers for EVM
- [0xtender/events-schema-generator](packages/events-schema-generator/README.md) - A prisma schema generator for contracts.
- [0xtender/heisenberg-cli](packages/heisenberg-cli/README.md) - A cli tool to generate input and output schema for monitoring.

Run playground for generator

```bash
npx tsx watch --tsconfig tsconfig.base.json ./packages/events-schema-generator/src/playground.ts
```

Heisenberg-CLI

A cli for generative tools

```
$ 0xtender-heisenberg --version
```

```
$ 0xtender-heisenberg generate --help

Usage: heisenberg generate [options] <contracts.json>

Generate contract events' schema

Arguments:
  contracts.json                   contracts to generate schema for

Options:
  -i, --input-file <input_file>    base input file for the schema
  -o, --output-file <output_file>  output file for the schema
  -h, --help                       display help for command
```

## Example

```bash
# Run from project-root.

npx tsx --tsconfig tsconfig.base.json ./packages/heisenberg-cli/src/lib/heisenberg.ts generate packages/heisenberg-cli/examples/contracts.json -i ./packages/heisenberg-cli/examples/input.prisma -o ./packages/heisenberg-cli/examples/output.prisma
```
