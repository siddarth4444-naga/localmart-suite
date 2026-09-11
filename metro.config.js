const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;
config.watchFolders = [
  projectRoot,
  path.resolve(projectRoot, 'node_modules'),
];

config.resolver.blockList = [
  /[\\/]LocalMart-Customer[\\/]/,
  /[\\/]LocalMart-Shopkeeper[\\/]/,
  /[\\/]LocalMart-Delivery[\\/]/,
];

module.exports = config;
