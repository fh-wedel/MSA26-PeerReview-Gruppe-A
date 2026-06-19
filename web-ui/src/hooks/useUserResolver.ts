import {useCallback, useEffect, useState} from 'react';
import {searchUsers} from '../api/communication';

interface UseUserResolverResult {
    /** Map of user sub UUID → username */
    userMap: Record<string, string>;
    /** Resolve a single user ID to a username, or return the fallback */
    resolveUserId: (id: string, fallback?: string) => string;
    /** Whether the user list is still loading */
    loading: boolean;
}

/**
 * Fetches all users from the Communication Service and caches them.
 * Provides a `resolveUserId(id)` helper to look up usernames by Cognito sub UUID.
 */
export const useUserResolver = (): UseUserResolverResult => {
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        searchUsers('')
            .then(users => {
                const map: Record<string, string> = {};
                users.forEach(u => {
                    map[u.id] = u.username;
                });
                setUserMap(map);
            })
            .catch(err => console.error('Failed to load user map', err))
            .finally(() => setLoading(false));
    }, []);

    const resolveUserId = useCallback(
        (id: string, fallback = 'Unknown') => userMap[id] ?? fallback,
        [userMap],
    );

    return {userMap, resolveUserId, loading};
};
