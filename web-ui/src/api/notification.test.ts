import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fetchNotifications, markAllNotificationsRead, markNotificationRead, streamNotifications} from './notification';
import {fetchEventSource} from '@microsoft/fetch-event-source';

vi.mock('@microsoft/fetch-event-source', () => ({
    fetchEventSource: vi.fn(() => Promise.resolve()),
}));

describe('notification api wrappers', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        sessionStorage.clear();
    });

    it('fetchNotifications fetches and returns data', async () => {
        const mockData = [{id: '1', title: 'Test'}];
        vi.mocked(fetch).mockResolvedValueOnce({ok: true, json: () => Promise.resolve(mockData)} as any);

        const res = await fetchNotifications();
        expect(fetch).toHaveBeenCalledWith('/api/notification/me', {
            headers: {'Content-Type': 'application/json'}
        });
        expect(res).toEqual(mockData);
    });

    it('fetchNotifications throws on error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ok: false} as any);
        await expect(fetchNotifications()).rejects.toThrow('Failed to fetch notifications');
    });

    it('markNotificationRead sends patch request', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ok: true} as any);
        sessionStorage.setItem('access_token', 'token');

        await markNotificationRead('notif1');
        expect(fetch).toHaveBeenCalledWith('/api/notification/notif1/read', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer token'
            }
        });
    });

    it('markNotificationRead throws on error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ok: false} as any);
        await expect(markNotificationRead('notif1')).rejects.toThrow('Failed to mark notification read');
    });

    it('markAllNotificationsRead sends post request', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ok: true} as any);
        await markAllNotificationsRead();
        expect(fetch).toHaveBeenCalledWith('/api/notification/me/read-all', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
    });

    it('markAllNotificationsRead throws on error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ok: false} as any);
        await expect(markAllNotificationsRead()).rejects.toThrow('Failed to mark all notifications read');
    });

    it('streamNotifications sets up fetchEventSource and handles messages', () => {
        const onNotif = vi.fn();
        const controller = streamNotifications(onNotif);

        expect(controller).toBeInstanceOf(AbortController);
        expect(fetchEventSource).toHaveBeenCalledWith(
            expect.stringMatching(/^\/api\/notification\/me\/stream\?t=\d+$/),
            expect.objectContaining({
                method: 'GET',
                openWhenHidden: true,
            })
        );

        // Simulate onmessage
        const callArgs = vi.mocked(fetchEventSource).mock.calls[0][1];
        if (callArgs.onmessage) {
            callArgs.onmessage({event: 'notification', data: '{"id":"1"}'} as any);
        }

        expect(onNotif).toHaveBeenCalledWith({id: '1'});
    });
});
