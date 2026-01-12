// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');

let expoConfig = null;
try {
  expoConfig = require('eslint-config-expo/flat');
} catch {
  expoConfig = null;
}

module.exports = defineConfig([
  ...(expoConfig ? [expoConfig] : []),
  {
    ignores: ['dist/*'],
  },
]);
