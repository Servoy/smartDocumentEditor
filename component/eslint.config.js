const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin-ts');
const onlyWarn = require('eslint-plugin-only-warn');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    plugins: {
      'only-warn': onlyWarn,
      '@stylistic/ts': stylistic,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/component-selector': ['warn', { type: 'element', prefix: 'smartdocumenteditor', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['warn', { type: 'attribute', prefix: 'smartdocumenteditor', style: 'camelCase' }],
      '@stylistic/ts/quotes': ['warn', 'single', { allowTemplateLiterals: true }],
      'max-len': ['warn', { code: 200 }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-prototype-builtins': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
