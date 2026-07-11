import {beforeEach, describe, expect, it} from 'vitest';
import {
  communicationApiClient,
  configApiClient,
  configurationApiClient,
  matchingApiClient,
  responseApiClient,
  submissionApiClient,
  usersApiClient
} from './clients';

describe('api clients configuration', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('exports all clients initialized properly', () => {
        expect(configApiClient).toBeDefined();
        expect(matchingApiClient).toBeDefined();
        expect(submissionApiClient).toBeDefined();
        expect(communicationApiClient).toBeDefined();
        expect(configurationApiClient).toBeDefined();
        expect(usersApiClient).toBeDefined();
        expect(responseApiClient).toBeDefined();
    });
});
