import next from 'eslint-config-next';

const config = [
  ...next,
  {
    ignores: [
      'node_modules/**',
      'public/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'generated/**', // Prisma generated files
      '*.config.js',
      '*.config.ts',
    ],
  },
];

export default config;
