import React from 'react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {AuthProvider, useAuth} from './AuthContext';
import * as pkce from '../utils/pkce';

// Mock PKCE utils to return deterministic values
vi.mock('../utils/pkce', () => ({
    generateCodeVerifier: vi.fn(() => 'mock-verifier'),
    generateCodeChallenge: vi.fn(() => Promise.resolve('mock-challenge')),
}));

// Create a helper to generate mock JWT tokens
const createMockJwt = (payload: any) => {
    const header = btoa(JSON.stringify({alg: 'none'}));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
};

describe('AuthContext', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        // Clear storage before each test
        sessionStorage.clear();

        // Mock window.location for redirect tests
        Object.defineProperty(window, 'location', {
            writable: true,
            value: {...originalLocation, href: '', search: '', origin: 'http://localhost'},
        });

        // Mock fetch for token exchange
        global.fetch = vi.fn();

        // Set import.meta.env manually for tests
        (import.meta as any).env = {
            VITE_COGNITO_CLIENT_ID: 'test-client-id',
            VITE_COGNITO_DOMAIN: 'test-cognito-domain.auth.eu-central-1.amazoncognito.com',
            BASE_URL: '/'
        };
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        });
        vi.clearAllMocks();
    });

    const wrapper = ({children}: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    it('initializes as unauthenticated when no token is present', async () => {
        const {result} = renderHook(() => useAuth(), {wrapper});

        // Need to wait for useEffect to finish
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
    });

    it('initializes as authenticated when a valid token is in sessionStorage', async () => {
        const mockToken = createMockJwt({
            sub: 'user-123',
            email: 'test@example.com',
            'cognito:username': 'testuser',
            'cognito:groups': ['Admin']
        });
        sessionStorage.setItem('id_token', mockToken);

        const {result} = renderHook(() => useAuth(), {wrapper});

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
            roles: ['Admin']
        });
    });

    it('handles OAuth callback and exchanges code for tokens', async () => {
        // Setup URL with code and verifier in storage
        window.location.search = '?code=auth-code-123';
        sessionStorage.setItem('code_verifier', 'mock-verifier');

        // Mock the replaceState function since we call it
        window.history.replaceState = vi.fn();

        // Mock fetch response
        const mockIdToken = createMockJwt({
            sub: 'user-123',
            'cognito:username': 'authuser'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                id_token: mockIdToken,
                access_token: 'access-123',
                refresh_token: 'refresh-123'
            })
        });

        const {result} = renderHook(() => useAuth(), {wrapper});

        await act(async () => {
            // Wait for async effect and fetch to complete
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        // Check fetch arguments
        expect(global.fetch).toHaveBeenCalledWith(
            'https://__COGNITO_DOMAIN_PLACEHOLDER__/oauth2/token',
            expect.objectContaining({
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
        );

        // Check state update
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.username).toBe('authuser');

        // Check storage update
        expect(sessionStorage.getItem('id_token')).toBe(mockIdToken);
        expect(sessionStorage.getItem('access_token')).toBe('access-123');
        expect(sessionStorage.getItem('refresh_token')).toBe('refresh-123');
        expect(sessionStorage.getItem('code_verifier')).toBeNull(); // Should be cleaned up
    });

    it('login correctly constructs Cognito URL and redirects', async () => {
        const {result} = renderHook(() => useAuth(), {wrapper});

        await act(async () => {
            await result.current.login();
        });

        expect(pkce.generateCodeVerifier).toHaveBeenCalled();
        expect(pkce.generateCodeChallenge).toHaveBeenCalledWith('mock-verifier');
        expect(sessionStorage.getItem('code_verifier')).toBe('mock-verifier');

        // Verify URL
        expect(window.location.href).toContain('https://__COGNITO_DOMAIN_PLACEHOLDER__/login');
        expect(window.location.href).toContain('client_id=__COGNITO_CLIENT_ID_PLACEHOLDER__');
        expect(window.location.href).toContain('code_challenge=mock-challenge');
    });

    it('logout clears session storage and redirects', async () => {
        sessionStorage.setItem('id_token', 'test');
        sessionStorage.setItem('access_token', 'test');

        const {result} = renderHook(() => useAuth(), {wrapper});

        act(() => {
            result.current.logout();
        });

        expect(sessionStorage.getItem('id_token')).toBeNull();
        expect(sessionStorage.getItem('access_token')).toBeNull();
        expect(window.location.href).toBe('http://localhost:3000/');
    });
});
