import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useUserResolver} from './useUserResolver';
import {searchUsers} from '../api/communication';

vi.mock('../api/communication', () => ({
    searchUsers: vi.fn(),
}));

describe('useUserResolver', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Because useUserResolver uses module-level variables (cachedUsers, fetchPromise)
        // we would ideally clear those between tests, but since they are not exported,
        // we can test the cached behavior inherently by verifying searchUsers is only called once.
    });

    it('fetches users, builds map, and resolves IDs', async () => {
        const mockUsers = [
            {id: 'u1', username: 'alice'},
            {id: 'u2', username: 'bob'}
        ];

        vi.mocked(searchUsers).mockResolvedValue(mockUsers);

        const {result} = renderHook(() => useUserResolver());

        // Initially loading
        expect(result.current.loading).toBe(true);

        // Default fallback during load
        expect(result.current.resolveUserId('u1')).toBe('Unknown');

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(searchUsers).toHaveBeenCalledWith('');
        expect(result.current.loading).toBe(false);

        // Resolves correctly
        expect(result.current.resolveUserId('u1')).toBe('alice');
        expect(result.current.resolveUserId('u2')).toBe('bob');

        // Custom fallback
        expect(result.current.resolveUserId('u3', 'Not Found')).toBe('Not Found');

        // Full user list is available
        expect(result.current.users).toEqual(mockUsers);
    });

    it('returns cached users on subsequent renders', async () => {
        vi.mocked(searchUsers).mockClear(); // Clear the call from previous test

        const {result} = renderHook(() => useUserResolver());

        // Should be instantly loaded from cache
        expect(result.current.loading).toBe(false);
        expect(result.current.resolveUserId('u1')).toBe('alice');

        // searchUsers should NOT be called again
        expect(searchUsers).not.toHaveBeenCalled();
    });
});
