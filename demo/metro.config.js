const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the repo root so Metro picks up changes to the linked
// `react-native-data-detector` package (a `file:..` dependency).
config.watchFolders = [monorepoRoot];

// Resolve from the demo's node_modules first, then the repo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// The repo root carries its own, newer react / react-native (pulled in by the
// library's peer + test dependencies). Pin the singletons to the demo's copies
// and block the root ones so Metro never mixes versions — mixing causes crashes
// like "Property 'MessageQueue' doesn't exist".
//
// reanimated and react-native-worklets are stateful JSI singletons too: two
// instances crash the worklet runtime the same way. They only live in the demo's
// node_modules today, but we pin them defensively so a future root install can't
// silently introduce a second copy.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-reanimated': path.resolve(projectRoot, 'node_modules/react-native-reanimated'),
  'react-native-worklets': path.resolve(projectRoot, 'node_modules/react-native-worklets'),
};

const escapeForRegExp = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  new RegExp(`^${escapeForRegExp(path.resolve(monorepoRoot, 'node_modules/react-native'))}/.*`),
  new RegExp(`^${escapeForRegExp(path.resolve(monorepoRoot, 'node_modules/react'))}/.*`),
];

module.exports = config;
