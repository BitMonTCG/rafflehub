export default {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['import'],
  rules: {
    // Critical rule to enforce .js extension on local imports
    // This prevents the "Cannot find module" errors in production ES modules
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'always',
        ts: 'never'
      }
    ],
    // Ensure imports are properly resolved
    'import/no-unresolved': 'error'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.tsx']
      }
    }
  },
  overrides: [
    // TypeScript-specific rules
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript handles these, so we can disable them
        'no-undef': 'off',
        'no-unused-vars': 'off'
      }
    }
  ]
};
