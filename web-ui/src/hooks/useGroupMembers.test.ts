import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useGroupMembers} from './useGroupMembers';
import {usersApiClient} from '../api/clients';

vi.mock('../api/clients', () => ({
    usersApiClient: {
        groups: {
            listGroupMembers: vi.fn(),
        }
    }
}));

describe('useGroupMembers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches members for a specific group and maps them correctly', async () => {
        const mockData = {
            users: [
                {sub: 'user-1', username: 'testuser1'},
                {sub: 'user-2', username: 'testuser2'}
            ]
        };

        vi.mocked(usersApiClient.groups.listGroupMembers).mockResolvedValue({
            ok: true,
            data: mockData
        } as any);

        const {result} = renderHook(() => useGroupMembers('Reviewer'));

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(usersApiClient.groups.listGroupMembers).toHaveBeenCalledWith('Reviewer');
        expect(result.current.loading).toBe(false);
        expect(result.current.members).toEqual([
            {id: 'user-1', username: 'testuser1'},
            {id: 'user-2', username: 'testuser2'}
        ]);
    });

    it('handles empty user list', async () => {
        vi.mocked(usersApiClient.groups.listGroupMembers).mockResolvedValue({
            ok: true,
            data: {} // missing 'users' array
        } as any);

        const {result} = renderHook(() => useGroupMembers('Reviewer'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.members).toEqual([]);
    });

    it('handles network error gracefully', async () => {
        vi.mocked(usersApiClient.groups.listGroupMembers).mockRejectedValue(new Error('Network error'));

        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        });

        const {result} = renderHook(() => useGroupMembers('Reviewer'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.members).toEqual([]);

        consoleSpy.mockRestore();
    });
});
