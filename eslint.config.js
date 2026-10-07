// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**", "server/node_modules/**"],
  },
  {
    files: ["**/*.{js,jsx,cjs,mjs}"],
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "func-style": ["error", "expression", { "allowArrowFunctions": true }],
    },
  }
]);
