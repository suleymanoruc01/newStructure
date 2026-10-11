const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const zodCjs = path.resolve(projectRoot, 'node_modules/zod/index.cjs');

const config = mergeConfig(getDefaultConfig(projectRoot), {
  watchFolders: [monorepoRoot],
  resolver: {
    unstable_enableSymlinks: true,
    unstable_enablePackageExports: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'zod') {
        return { type: 'sourceFile', filePath: zodCjs };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
});

module.exports = withNativeWind(config, { input: './global.css' });
