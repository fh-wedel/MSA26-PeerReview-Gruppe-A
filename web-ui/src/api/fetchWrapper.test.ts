import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {fetchWithAuth} from './fetchWrapper';

describe('fetchWrapper', () => {
    const originalLocation = window.location;
    const originalOrigin = window.location.origin;

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        sessionStorage.clear();

        // Mock window.location
        delete (window as any).location;
        window.location = {...originalLocation, href: 'http://localhost/', origin: 'http://localhost'};
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.location = originalLocation;
    });

    it('passes through successful fetch without token refresh', async () => {
        const mockResponse = {ok: true, status: 200, json: () => Promise.resolve({data: 'test'})};
        vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

        const res = await fetchWithAuth('http://example.com');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(res.status).toBe(200);
    });

    it('attempts to refresh token on 401', async () => {
        const unauthResponse = {ok: false, status: 401};
        const successRefresh = {ok: true, json: () => Promise.resolve({access_token: 'new_token', id_token: 'new_id'})};
        const authResponse = {ok: true, status: 200};

        vi.mocked(fetch)
            .mockResolvedValueOnce(unauthResponse as any) // Original request
            .mockResolvedValueOnce(successRefresh as any) // Token refresh request
            .mockResolvedValueOnce(authResponse as any);  // Retried request

        sessionStorage.setItem('refresh_token', 'old_refresh');

        const res = await fetchWithAuth('http://example.com/api', {headers: new Headers()});

        expect(fetch).toHaveBeenCalledTimes(3);
        expect(sessionStorage.getItem('access_token')).toBe('new_token');
        expect(res.status).toBe(200);
    });

    it('redirects to root when refresh token is missing on 401', async () => {
        const unauthResponse = {ok: false, status: 401};
        vi.mocked(fetch).mockResolvedValueOnce(unauthResponse as any);

        await fetchWithAuth('http://example.com/api');

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(window.location.href).toContain('http://localhost');
    });

    it('redirects to root when refresh token fails', async () => {
        const unauthResponse = {ok: false, status: 403};
        const failRefresh = {ok: false, status: 400};

        vi.mocked(fetch)
            .mockResolvedValueOnce(unauthResponse as any)
            .mockResolvedValueOnce(failRefresh as any);

        sessionStorage.setItem('refresh_token', 'old_refresh');
        sessionStorage.setItem('access_token', 'old_access');

        await fetchWithAuth('http://example.com/api');

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(sessionStorage.getItem('access_token')).toBeNull();
        expect(sessionStorage.getItem('refresh_token')).toBeNull();
        expect(window.location.href).toContain('http://localhost');
    });
});
