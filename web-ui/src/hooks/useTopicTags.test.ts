import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useTopicTags} from './useTopicTags';
import {configurationApiClient} from '../api/clients';

vi.mock('../api/clients', () => ({
    configurationApiClient: {
        topicTags: {
            listTopicTags: vi.fn(),
            addTopicTag: vi.fn(),
            deleteTopicTag: vi.fn(),
        }
    }
}));

describe('useTopicTags', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches topic tags successfully on mount', async () => {
        const mockTags = [{tagName: 'Java'}, {tagName: 'React'}];

        vi.mocked(configurationApiClient.topicTags.listTopicTags).mockResolvedValue({
            ok: true,
            data: mockTags
        } as any);

        const {result} = renderHook(() => useTopicTags());

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(configurationApiClient.topicTags.listTopicTags).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.topicTags).toEqual(mockTags);
        expect(result.current.error).toBeNull();
    });

    it('handles errors when fetching', async () => {
        vi.mocked(configurationApiClient.topicTags.listTopicTags).mockResolvedValue({
            ok: false,
            statusText: 'Internal Error'
        } as any);

        const {result} = renderHook(() => useTopicTags());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.topicTags).toEqual([]);
        expect(result.current.error).toBeInstanceOf(Error);
    });

    it('addTag calls api and refreshes tags', async () => {
        vi.mocked(configurationApiClient.topicTags.listTopicTags).mockResolvedValue({ok: true, data: []} as any);

        const {result} = renderHook(() => useTopicTags());
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Setup for add
        vi.mocked(configurationApiClient.topicTags.addTopicTag).mockResolvedValue({ok: true} as any);

        await act(async () => {
            await result.current.addTag('NewTag');
        });

        expect(configurationApiClient.topicTags.addTopicTag).toHaveBeenCalledWith({tagName: 'NewTag'});
        expect(configurationApiClient.topicTags.listTopicTags).toHaveBeenCalledTimes(2); // Initial mount + after add
    });

    it('deleteTag calls api and refreshes tags', async () => {
        vi.mocked(configurationApiClient.topicTags.listTopicTags).mockResolvedValue({ok: true, data: []} as any);

        const {result} = renderHook(() => useTopicTags());
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Setup for delete
        vi.mocked(configurationApiClient.topicTags.deleteTopicTag).mockResolvedValue({ok: true} as any);

        await act(async () => {
            await result.current.deleteTag('OldTag');
        });

        expect(configurationApiClient.topicTags.deleteTopicTag).toHaveBeenCalledWith('OldTag');
        expect(configurationApiClient.topicTags.listTopicTags).toHaveBeenCalledTimes(2); // Initial mount + after delete
    });
});
