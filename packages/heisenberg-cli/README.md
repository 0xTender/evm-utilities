# heisenberg-cli

A cli for evm-utilities

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
