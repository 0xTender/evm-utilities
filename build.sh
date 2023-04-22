#!/bin/bash  
echo Publishing $1 $2

# version
version=$1
tag="${2:-latest}"

if [ -z "$version" ]; then
  echo "Version is required"
  exit 1
fi

if [ "$tag" != "latest" ] && [ "$tag" != "next" ]; then
  echo "Tag must be latest or next"
  exit 1
fi

npm run publish:package evm-helpers $version $tag
npm run publish:package events-schema-generator $version $tag
npm run publish:package heisenberg-cli $version $tag