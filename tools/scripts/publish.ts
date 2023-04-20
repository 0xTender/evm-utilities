/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */

import * as devkit from '@nrwl/devkit';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { join } from 'path';

function invariant(
  condition: string | boolean | devkit.ProjectGraphProjectNode,
  message: unknown
) {
  if (!condition) {
    console.error(chalk.bold.red(message));
    process.exit(1);
  }
}

// Executing publish script: node path/to/publish.mjs {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
let [, , name, version, tag = 'latest', access = 'private'] = process.argv;
const parentRoot = join(
  __dirname,
  '..',
  '..',
  'packages',
  name,
  'package.json'
);

if (version === undefined) {
  version = JSON.parse(readFileSync(parentRoot).toString()).version;
} else {
  const json = JSON.parse(readFileSync(parentRoot).toString());
  json.version = version;
  writeFileSync(parentRoot, JSON.stringify(json, null, 2));
}

if (name === 'events-schema-generator') {
  // execute a shell command
  execSync(
    `cp -r packages/events-schema-generator/src/templates dist/packages/events-schema-generator/src`
  );
}

execSync(`npx nx build ${name} --prod --with-deps --verbose`);

// A simple SemVer validation to validate the version
const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
invariant(
  version && validVersion.test(version),
  `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${version}.`
);

const graph = devkit.readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`
);

process.chdir(outputPath);

// Updating the version in "package.json" before publishing
try {
  const json = JSON.parse(readFileSync(`package.json`).toString());
  json.version = version;
  writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(
    chalk.bold.red(`Error reading package.json file from library build output.`)
  );
}

// Execute "npm publish" to publish
execSync(`npm publish --access ${access} --tag ${tag}`);
