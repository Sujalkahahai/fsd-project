import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  { files: ['**/*.{js,jsx}'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { window: 'readonly', document: 'readonly', localStorage: 'readonly', fetch: 'readonly', console: 'readonly', process: 'readonly', structuredClone: 'readonly', AbortController: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', alert: 'readonly' } }, plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }], 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn', 'react-refresh/only-export-components': 'off' } },
];
