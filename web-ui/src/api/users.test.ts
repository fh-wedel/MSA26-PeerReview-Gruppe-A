import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    addGroupMember,
    fetchGroupMembers,
    fetchUserDetails,
    removeGroupMember,
    searchUsers,
    updateUserAttributes
} from './users';
import {usersApiClient} from './clients';
import {fetchWithAuth} from './fetchWrapper';

vi.mock('./clients', () => ({
    usersApiClient: {
        search: {
            searchUsers: vi.fn(),
        },
        groups: {
            listGroupMembers: vi.fn(),
            addGroupMember: vi.fn(),
            removeGroupMember: vi.fn(),
            updateUserAttributes: vi.fn(),
        }
    }
}));

vi.mock('./fetchWrapper', () => ({
    fetchWithAuth: vi.fn(),
}));

describe('users api wrappers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('searchUsers returns users array', async () => {
        vi.mocked(usersApiClient.search.searchUsers).mockResolvedValueOnce({data: {users: [{username: 'u1'}]}} as any);
        const res = await searchUsers('u');
        expect(res).toEqual([{username: 'u1'}]);
        expect(usersApiClient.search.searchUsers).toHaveBeenCalledWith({q: 'u'});
    });

    it('fetchGroupMembers returns users array', async () => {
        vi.mocked(usersApiClient.groups.listGroupMembers).mockResolvedValueOnce({data: {users: [{username: 'u1'}]}} as any);
        const res = await fetchGroupMembers('Admin');
        expect(res).toEqual([{username: 'u1'}]);
    });

    it('addGroupMember sends data and returns user', async () => {
        vi.mocked(usersApiClient.groups.addGroupMember).mockResolvedValueOnce({data: {username: 'u1'}} as any);
        const res = await addGroupMember('Admin', 'u1', {key: 'val'});
        expect(res).toEqual({username: 'u1'});
        expect(usersApiClient.groups.addGroupMember).toHaveBeenCalledWith('Admin', {
            username: 'u1',
            customAttributes: {key: 'val'}
        });
    });

    it('removeGroupMember calls client', async () => {
        vi.mocked(usersApiClient.groups.removeGroupMember).mockResolvedValueOnce({} as any);
        await removeGroupMember('Admin', 'u1');
        expect(usersApiClient.groups.removeGroupMember).toHaveBeenCalledWith('Admin', 'u1');
    });

    it('updateUserAttributes calls client and returns user', async () => {
        vi.mocked(usersApiClient.groups.updateUserAttributes).mockResolvedValueOnce({data: {username: 'u1'}} as any);
        const res = await updateUserAttributes('Admin', 'u1', {key: 'val2'});
        expect(res).toEqual({username: 'u1'});
        expect(usersApiClient.groups.updateUserAttributes).toHaveBeenCalledWith('Admin', 'u1', {customAttributes: {key: 'val2'}});
    });

    it('fetchUserDetails calls fetchWithAuth and returns user data', async () => {
        const mockData = {username: 'u1'};
        vi.mocked(fetchWithAuth).mockResolvedValueOnce({ok: true, json: () => Promise.resolve(mockData)} as any);

        const res = await fetchUserDetails('u1');
        expect(res).toEqual(mockData);
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/users/details/u1', expect.any(Object));
    });

    it('fetchUserDetails throws on error', async () => {
        vi.mocked(fetchWithAuth).mockResolvedValueOnce({ok: false} as any);
        await expect(fetchUserDetails('u1')).rejects.toThrow('Failed to fetch user details');
    });
});
