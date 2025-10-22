const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const n = require('eslint-plugin-n');

module.exports = [
  // Recommended base config
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'build/**',
      'logs/**',
      '*.log',
      'eslint.config.js', // Ignore the config file itself
    ],
  },

  // Main configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      n,
    },
    rules: {
      // Console rules
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // Variable rules
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',

      // Comparison rules
      eqeqeq: ['error', 'always'],

      // Code structure rules
      curly: ['error', 'all'],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Async rules
      'no-return-await': 'error',
      'require-await': 'warn',

      // Node.js specific
      'n/no-missing-require': 'error',
      'n/no-extraneous-require': 'error',
      'n/no-unpublished-require': 'off',
    },
  },

  // Test file overrides
  {
    files: ['__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'n/no-unpublished-require': 'off',
    },
  },

  // Allow console in scripts, jobs, and seed files
  {
    files: ['scripts/**/*.js', 'jobs/**/*.js', 'data/**/*.js', 'services/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Prettier config (must be last)
  prettier,
];
