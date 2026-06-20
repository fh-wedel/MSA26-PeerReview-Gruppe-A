import {useCallback, useEffect, useState} from 'react';
import {searchUsers} from '../api/communication';
import type {UserSummary} from '../api/communication';

interface UseUserResolverResult {
    /** Map of user sub UUID → username */
    userMap: Record<string, string>;
    /** Resolve a single user ID to a username, or return the fallback */
    resolveUserId: (id: string, fallback?: string) => string;
    /** Whether the user list is still loading */
    loading: boolean;
    /** Full list of users */
    users: UserSummary[];
}

let cachedUsers: UserSummary[] | null = null;
let fetchPromise: Promise<UserSummary[]> | null = null;

/**
 * Fetches all users from the Communication Service and caches them.
 * Provides a `resolveUserId(id)` helper to look up usernames by Cognito sub UUID.
 */
export const useUserResolver = (): UseUserResolverResult => {
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [users, setUsers] = useState<UserSummary[]>(cachedUsers || []);
    const [loading, setLoading] = useState(!cachedUsers);

    useEffect(() => {
        if (cachedUsers) {
            const map: Record<string, string> = {};
            cachedUsers.forEach(u => {
                map[u.id] = u.username;
            });
            setUserMap(map);
            setUsers(cachedUsers);
            setLoading(false);
            return;
        }

        if (!fetchPromise) {
            fetchPromise = searchUsers('');
        }

        fetchPromise
            .then(fetchedUsers => {
                cachedUsers = fetchedUsers;
                const map: Record<string, string> = {};
                fetchedUsers.forEach(u => {
                    map[u.id] = u.username;
                });
                setUserMap(map);
                setUsers(fetchedUsers);
            })
            .catch(err => {
                console.error('Failed to load user map', err);
                fetchPromise = null;
            })
            .finally(() => setLoading(false));
    }, []);

    const resolveUserId = useCallback(
        (id: string, fallback = 'Unknown') => userMap[id] ?? fallback,
        [userMap],
    );

    return {userMap, resolveUserId, loading, users};
};
