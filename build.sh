#!/bin/bash  
use_yalc="${3:-false}"

# version
version=$1
tag="${2:-latest}"

echo Publishing $version $tag with yalc: $use_yalc

if [ -z "$version" ]; then
  echo "Version is required"
  echo "Usage ./build.sh <version> [tag]"
  exit 1
fi

if [ "$tag" != "latest" ] && [ "$tag" != "next" ]; then
  echo "Tag must be latest or next"
  echo "Usage ./build.sh <version> [tag]"
  exit 1
fi

if [ "$use_yalc" == "true" ]; then
    npm run publish:package evm-helpers $version $tag public true
    npm run publish:package events-schema-generator $version $tag public true
    npm run publish:package heisenberg-cli $version $tag public true
    exit 0
fi

npm run publish:package evm-helpers $version $tag
npm run publish:package events-schema-generator $version $tag
npm run publish:package heisenberg-cli $version $tag