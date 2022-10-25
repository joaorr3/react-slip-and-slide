/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');

const rootPackages = path.resolve(path.join(__dirname, '../../packages'));

const extraNodeModules = {
  '@react-slip-and-slide/utils': rootPackages,
  '@react-slip-and-slide/models': rootPackages,
};
const watchFolders = [rootPackages];

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) => {
        return name in target
          ? target[name]
          : path.join(process.cwd(), `node_modules/${name}`);
      },
    }),
  },
  watchFolders,
};
