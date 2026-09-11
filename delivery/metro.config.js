const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ensure BOTH the project itself AND the shared node_modules are watched
config.watchFolders = [
  projectRoot,
  path.resolve(projectRoot, 'node_modules'),
];

// Block sibling project files so they don't get mixed in
config.resolver.blockList = [
  /[\\/]LocalMart-Customer[\\/]/,
  /[\\/]LocalMart-Shopkeeper[\\/]/,
  /[\\/]LocalMart[\\/](app|src)[\\/]/,
];

module.exports = config;
