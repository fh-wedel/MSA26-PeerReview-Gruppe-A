import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useWorkflowPlugins} from './useWorkflowPlugins';
import {configurationApiClient} from '../api/clients';

vi.mock('../api/clients', () => ({
    configurationApiClient: {
        reviewTypes: {listReviewTypes: vi.fn()},
        reviewTemplates: {listReviewTemplates: vi.fn()},
    }
}));

describe('useWorkflowPlugins', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches plugins successfully', async () => {
        const mockTypes = [{id: 't1', name: 'Type 1'}];
        const mockTemplates = [{id: 'tpl1', name: 'Template 1'}];

        vi.mocked(configurationApiClient.reviewTypes.listReviewTypes).mockResolvedValue({
            ok: true,
            data: mockTypes
        } as any);

        vi.mocked(configurationApiClient.reviewTemplates.listReviewTemplates).mockResolvedValue({
            ok: true,
            data: mockTemplates
        } as any);

        const {result} = renderHook(() => useWorkflowPlugins());

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(configurationApiClient.reviewTypes.listReviewTypes).toHaveBeenCalled();
        expect(configurationApiClient.reviewTemplates.listReviewTemplates).toHaveBeenCalled();

        expect(result.current.loading).toBe(false);
        expect(result.current.types).toEqual(mockTypes);
        expect(result.current.templates).toEqual(mockTemplates);
        expect(result.current.error).toBeNull();
    });

    it('sets error if any request fails', async () => {
        vi.mocked(configurationApiClient.reviewTypes.listReviewTypes).mockResolvedValue({
            ok: true,
            data: []
        } as any);

        vi.mocked(configurationApiClient.reviewTemplates.listReviewTemplates).mockResolvedValue({
            ok: false,
            statusText: 'Bad Request'
        } as any);

        const {result} = renderHook(() => useWorkflowPlugins());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.types).toEqual([]);
        expect(result.current.templates).toEqual([]);
        expect(result.current.error).toBeInstanceOf(Error);
    });
});
