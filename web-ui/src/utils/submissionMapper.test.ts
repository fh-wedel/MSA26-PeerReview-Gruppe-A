import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapConfigToDisplay } from './submissionMapper';
import { matchingApiClient, submissionApiClient, responseApiClient } from '../api/clients';

vi.mock('../api/clients', () => ({
  matchingApiClient: {
    matches: {
      getMatchesBySubmission: vi.fn(),
    },
  },
  submissionApiClient: {
    submissions: {
      getSubmission: vi.fn(),
    },
  },
  responseApiClient: {
    results: {
      resultsDetail: vi.fn(),
    },
  },
}));

describe('mapConfigToDisplay', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws an error if createdAt is missing', async () => {
    await expect(mapConfigToDisplay({ id: '123' })).rejects.toThrow('Submission 123 is missing a creation date');
  });

  it('maps basic config to display format', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockRejectedValue(new Error('Not found'));
    (submissionApiClient.submissions.getSubmission as any).mockRejectedValue(new Error('Not found'));
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({
      id: '1',
      title: 'Test Title',
      createdAt: '2023-01-01T00:00:00Z',
      reviewProcessType: 'SINGLE_BLIND',
      numberOfExaminers: 2,
    });

    expect(result).toEqual({
      id: '1',
      title: 'Test Title',
      createdAt: '2023-01-01T00:00:00Z',
      updateTime: '2023-01-01T00:00:00Z',
      status: 'Created',
      reviewerId: undefined,
      reviewProcessType: 'SINGLE_BLIND',
      numberOfExaminers: 2,
    });
  });

  it('handles matched status', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({
      data: {
        status: 'MATCHED',
        matches: [{ examinerId: 'reviewer1' }],
        matchedAt: '2023-01-02T00:00:00Z',
      },
    });
    (submissionApiClient.submissions.getSubmission as any).mockRejectedValue(new Error('Not found'));
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Matched');
    expect(result.reviewerId).toBe('reviewer1');
    expect(result.updateTime).toBe('2023-01-02T00:00:00Z');
  });

  it('handles failed match status', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({
      data: {
        status: 'FAILED',
        matchedAt: '2023-01-02T00:00:00Z',
      },
    });
    (submissionApiClient.submissions.getSubmission as any).mockRejectedValue(new Error('Not found'));
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Failed');
  });

  it('handles submitted status', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({ data: {} });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({
      data: { status: 'SUBMITTED', updatedAt: '2023-01-03T00:00:00Z' },
    });
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Submitted');
    expect(result.updateTime).toBe('2023-01-03T00:00:00Z');
  });

  it('handles ready for review status', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({ data: {} });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({
      data: { status: 'READY_FOR_REVIEW' },
    });
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Ready for Review');
  });

  it('handles waiting for submission status', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({ data: {} });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({
      data: { status: 'WAITING_FOR_SUBMISSION' },
    });
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Waiting for Submission');
  });

  it('handles draft status', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({ data: {} });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({
      data: { status: 'DRAFT' },
    });
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('Not found'));

    const result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Draft');
  });

  it('handles review statuses with 0 human reviews expected', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({ data: { matches: [] } });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({ data: {} });
    
    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: true, aiStatus: 'PROCESSING' }]
    });
    let result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('AI Review Processing');

    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: true, aiStatus: 'FAILED' }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('AI Review Failed');

    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: true, aiStatus: 'COMPLETED' }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('AI Review Completed');
    
    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: false }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('Review Completed');
  });

  it('handles review statuses with human reviews expected', async () => {
    (matchingApiClient.matches.getMatchesBySubmission as any).mockResolvedValue({ data: { numberOfExaminers: 2 } });
    (submissionApiClient.submissions.getSubmission as any).mockResolvedValue({ data: {} });
    
    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: false }]
    });
    let result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('1 / 2 Human Reviews Completed');

    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: false }, { isAiGenerated: false }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('All Human Reviews Completed');

    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: false }, { isAiGenerated: false }, { isAiGenerated: true, aiStatus: 'PROCESSING' }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('All Human Reviews Completed (AI Processing)');

    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: false }, { isAiGenerated: false }, { isAiGenerated: true, aiStatus: 'FAILED' }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('All Human Reviews Completed (AI Failed)');

    (responseApiClient.results.resultsDetail as any).mockResolvedValue({
      data: [{ isAiGenerated: false }, { isAiGenerated: false }, { isAiGenerated: true, aiStatus: 'COMPLETED' }]
    });
    result = await mapConfigToDisplay({ id: '1', createdAt: '2023-01-01T00:00:00Z' });
    expect(result.status).toBe('All Reviews Completed');
  });
});
