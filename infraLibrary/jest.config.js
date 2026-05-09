module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@shared/constants$': '<rootDir>/../infraBaseline/lib/constants.ts',
    },
    setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
};
