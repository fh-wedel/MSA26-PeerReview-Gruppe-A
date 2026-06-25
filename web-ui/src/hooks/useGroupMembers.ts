import {useEffect, useState} from 'react';
import {usersApiClient} from '../api/clients';
import type {UserSummary} from '../api/communication';

export const useGroupMembers = (groupName: string) => {
    const [members, setMembers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        usersApiClient.groups.listGroupMembers(groupName)
            .then(res => {
                if (isMounted) {
                    const mapped = (res.data.users || []).map(u => ({ id: u.sub, username: u.username }));
                    setMembers(mapped);
                }
            })
            .catch(err => {
                console.error(`Failed to load ${groupName} members`, err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
            
        return () => { isMounted = false; };
    }, [groupName]);

    return { members, loading };
};
