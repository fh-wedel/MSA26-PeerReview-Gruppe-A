import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
    fetchChatDetail,
    fetchChats,
    fetchSubmissionMatch,
    fetchWorkflowRulesForSubmission,
    searchUsers,
    sendMessage
} from './communication';
import {communicationApiClient, configurationApiClient, matchingApiClient, usersApiClient} from './clients';

vi.mock('./clients', () => ({
    communicationApiClient: {
        chats: {
            listChats: vi.fn(),
            getChat: vi.fn(),
            sendMessage: vi.fn(),
        }
    },
    configurationApiClient: {
        submissions: {
            getRulesForSubmission: vi.fn(),
        }
    },
    matchingApiClient: {
        matches: {
            getMatchesBySubmission: vi.fn(),
        }
    },
    usersApiClient: {
        search: {
            searchUsers: vi.fn(),
        }
    }
}));

describe('communication api wrappers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchChats returns data', async () => {
        vi.mocked(communicationApiClient.chats.listChats).mockResolvedValueOnce({data: {chats: []}} as any);
        const res = await fetchChats();
        expect(res).toEqual({chats: []});
    });

    it('fetchChatDetail returns data', async () => {
        vi.mocked(communicationApiClient.chats.getChat).mockResolvedValueOnce({data: {chatId: 'c1'}} as any);
        const res = await fetchChatDetail('c1');
        expect(res).toEqual({chatId: 'c1'});
        expect(communicationApiClient.chats.getChat).toHaveBeenCalledWith('c1', {limit: 50, nextToken: undefined});
    });

    it('sendMessage calls api and returns data', async () => {
        vi.mocked(communicationApiClient.chats.sendMessage).mockResolvedValueOnce({data: {chatId: 'c1'}} as any);
        const req = {body: 'hello', chatContext: {type: 'GENERAL' as const}};
        const res = await sendMessage(req);
        expect(res).toEqual({chatId: 'c1'});
        expect(communicationApiClient.chats.sendMessage).toHaveBeenCalledWith(req);
    });

    it('searchUsers maps raw data to UserSummary', async () => {
        vi.mocked(usersApiClient.search.searchUsers).mockResolvedValueOnce({
            data: {users: [{sub: 'id1', username: 'user1'}]}
        } as any);
        const res = await searchUsers('user');
        expect(res).toEqual([{id: 'id1', username: 'user1'}]);
    });

    it('fetchSubmissionMatch returns data', async () => {
        vi.mocked(matchingApiClient.matches.getMatchesBySubmission).mockResolvedValueOnce({data: {status: 'MATCHED'}} as any);
        const res = await fetchSubmissionMatch('sub1');
        expect(res).toEqual({status: 'MATCHED'});
    });

    it('fetchWorkflowRulesForSubmission returns data', async () => {
        vi.mocked(configurationApiClient.submissions.getRulesForSubmission).mockResolvedValueOnce({
            data: {authorAnonymous: true}
        } as any);
        const res = await fetchWorkflowRulesForSubmission('sub1');
        expect(res).toEqual({authorAnonymous: true});
    });
});
