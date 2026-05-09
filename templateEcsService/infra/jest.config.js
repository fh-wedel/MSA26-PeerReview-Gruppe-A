module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/../../infraBaseline/lib'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
};
