import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useAssignments} from './useAssignments';
import {matchingApiClient} from '../api/clients';
import {useAuth} from '../contexts/AuthContext';

vi.mock('../api/clients', () => ({
    matchingApiClient: {
        matches: {
            getMatchesByExaminer: vi.fn(),
        }
    }
}));

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('useAssignments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns empty assignments and not loading if unauthenticated or missing username', () => {
        vi.mocked(useAuth).mockReturnValue({user: null} as any);

        const {result} = renderHook(() => useAssignments());

        expect(result.current.loading).toBe(false);
        expect(result.current.assignments).toEqual([]);
        expect(matchingApiClient.matches.getMatchesByExaminer).not.toHaveBeenCalled();
    });

    it('returns empty assignments if user is not a reviewer or admin', () => {
        vi.mocked(useAuth).mockReturnValue({user: {username: 'test', roles: ['Author']}} as any);

        const {result} = renderHook(() => useAssignments());

        expect(result.current.loading).toBe(false);
        expect(result.current.assignments).toEqual([]);
        expect(matchingApiClient.matches.getMatchesByExaminer).not.toHaveBeenCalled();
    });

    it('fetches assignments for reviewers successfully', async () => {
        vi.mocked(useAuth).mockReturnValue({user: {username: 'reviewer', roles: ['Reviewer']}} as any);

        const mockData = {
            assignments: [{submissionId: 'sub-1', assignedAt: '2024-01-01'}]
        };

        vi.mocked(matchingApiClient.matches.getMatchesByExaminer).mockResolvedValue({
            ok: true,
            data: mockData
        } as any);

        const {result} = renderHook(() => useAssignments());

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(matchingApiClient.matches.getMatchesByExaminer).toHaveBeenCalledWith('reviewer');
        expect(result.current.loading).toBe(false);
        expect(result.current.assignments).toEqual(mockData.assignments);
        expect(result.current.error).toBeNull();
    });

    it('handles 404 cleanly by setting empty array', async () => {
        vi.mocked(useAuth).mockReturnValue({user: {username: 'reviewer', roles: ['Reviewer']}} as any);

        vi.mocked(matchingApiClient.matches.getMatchesByExaminer).mockResolvedValue({
            ok: false,
            status: 404
        } as any);

        const {result} = renderHook(() => useAssignments());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.assignments).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('handles other errors', async () => {
        vi.mocked(useAuth).mockReturnValue({user: {username: 'reviewer', roles: ['Reviewer']}} as any);

        vi.mocked(matchingApiClient.matches.getMatchesByExaminer).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Server Error'
        } as any);

        const {result} = renderHook(() => useAssignments());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.assignments).toEqual([]);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toContain('Failed to fetch assignments');
    });
});
