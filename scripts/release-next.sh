#!/bin/bash

# Temporary forked from nuxt/framework

set -xe

# Bump versions to edge/next
node ./scripts/bump-next.mjs

# Update token
if [[ ! -z ${NPM_AUTH_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  npm whoami
fi

# Release packages
echo "Publishing package..."
npm publish --access public --tolerate-republish
