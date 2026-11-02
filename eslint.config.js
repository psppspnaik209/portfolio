import tseslint from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

const browserGlobals = {
  console: 'readonly',
  document: 'readonly',
  HTMLElement: 'readonly',
  HTMLScriptElement: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  URL: 'readonly',
  window: 'readonly',
};

export default [
  {
    ignores: ['dist', '.vite', 'node_modules', 'bundle-analysis.html'],
  },
  ...tseslint.configs['flat/recommended'],
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: browserGlobals,
    },
    plugins: {
      'react-refresh': reactRefresh,
      prettier: prettierPlugin,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];
