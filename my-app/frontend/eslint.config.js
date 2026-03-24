// https://docs.expo.dev/guides/using-eslint/
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', path.resolve(__dirname)]],
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
