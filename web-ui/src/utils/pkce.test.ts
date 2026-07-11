import {describe, expect, it} from 'vitest';
import {generateCodeChallenge, generateCodeVerifier} from './pkce';

describe('pkce utils', () => {
    describe('generateCodeVerifier', () => {
        it('returns a base64url-encoded string (no +, /, = chars)', () => {
            const verifier = generateCodeVerifier();
            expect(verifier).not.toMatch(/[\+\/\=]/);
            expect(verifier.length).toBeGreaterThan(0);
        });

        it('returns different values on successive calls', () => {
            const verifier1 = generateCodeVerifier();
            const verifier2 = generateCodeVerifier();
            expect(verifier1).not.toBe(verifier2);
        });
    });

    describe('generateCodeChallenge', () => {
        it('returns a base64url-encoded string', async () => {
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            expect(challenge).not.toMatch(/[\+\/\=]/);
            expect(challenge.length).toBeGreaterThan(0);
        });

        it('is deterministic for the same input', async () => {
            const verifier = 'test-verifier-string';
            const challenge1 = await generateCodeChallenge(verifier);
            const challenge2 = await generateCodeChallenge(verifier);
            expect(challenge1).toBe(challenge2);
        });

        it('produces different output for different input', async () => {
            const challenge1 = await generateCodeChallenge('verifier-1');
            const challenge2 = await generateCodeChallenge('verifier-2');
            expect(challenge1).not.toBe(challenge2);
        });
    });
});
