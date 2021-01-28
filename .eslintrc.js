module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: ['airbnb-base'],
  parserOptions: { ecmaVersion: 12 },
  rules: {
    semi: ['error', 'never'],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-console': 'off',
    'comma-dangle': [
      'error',
      { arrays: 'always-multiline', objects: 'always-multiline', functions: 'never' },
    ],
    'no-underscore-dangle': 'off',
    'object-curly-newline': ['error', { multiline: true }],
  },
}
