// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── Fix: react-native-svg (and other packages that ship TypeScript source) ──
// Metro resolves "source" field in package.json for these packages, which
// points to the raw `.ts` / `.tsx` files. Without this config, Metro cannot
// compute SHA-1 hashes for those files when they live inside node_modules.
const { resolver } = config;

// 1. Tell Metro to also watch node_modules that ship TypeScript source
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'node_modules/react-native-svg'),
  path.resolve(__dirname, 'node_modules/react-native-progress'),
];

// 2. Allow Metro to resolve .ts and .tsx inside node_modules
resolver.sourceExts = [
  ...new Set([...(resolver.sourceExts || []), 'ts', 'tsx', 'mts', 'cts']),
];

// 3. Prefer the pre-compiled CommonJS build over the raw TypeScript source
//    so Metro never has to hash/transform src/index.ts at all.
resolver.resolverMainFields = ['react-native', 'main', 'module'];

module.exports = config;
