const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the parent directory so Metro can resolve the file:.. dependency
config.watchFolders = [monorepoRoot];

// Ensure Metro resolves from the example's node_modules first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// The monorepo root also carries its own (newer) react / react-native, pulled in
// by npm auto-installing the library's peerDependencies. Pin the singletons to the
// example's copies so Metro and React Native codegen never mix versions — mixing
// breaks native component codegen (e.g. "Unable to determine event arguments" in
// VirtualViewNativeComponent).
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

const escapeForRegExp = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  new RegExp(`^${escapeForRegExp(path.resolve(monorepoRoot, 'node_modules/react-native'))}/.*`),
  new RegExp(`^${escapeForRegExp(path.resolve(monorepoRoot, 'node_modules/react'))}/.*`),
];

module.exports = config;
