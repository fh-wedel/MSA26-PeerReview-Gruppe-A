import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerAiReview } from './aiReviewHandler';
import { responseApiClient } from '../api/clients';

vi.mock('../api/clients', () => ({
  responseApiClient: {
    results: {
      aiReviewCreate: vi.fn(),
      resultsDetail: vi.fn(),
    },
  },
}));

describe('triggerAiReview', () => {
  const setReviewResults = vi.fn();
  const showSuccess = vi.fn();
  const showError = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing if submissionId is empty', async () => {
    await triggerAiReview('', setReviewResults, showSuccess, showError);
    expect(responseApiClient.results.aiReviewCreate).not.toHaveBeenCalled();
  });

  it('triggers successfully and refreshes data', async () => {
    (responseApiClient.results.aiReviewCreate as any).mockResolvedValue({});
    (responseApiClient.results.resultsDetail as any).mockResolvedValue({ data: [{ id: '1' }] });

    await triggerAiReview('sub1', setReviewResults, showSuccess, showError);

    expect(setReviewResults).toHaveBeenCalledWith([{ id: '1' }]);
    expect(showSuccess).toHaveBeenCalledWith('AI Review requested successfully!');
  });

  it('handles error, attempts refresh and shows error', async () => {
    (responseApiClient.results.aiReviewCreate as any).mockRejectedValue(new Error('fail'));
    (responseApiClient.results.resultsDetail as any).mockResolvedValue({ data: [{ id: '2' }] });

    await triggerAiReview('sub1', setReviewResults, showSuccess, showError);

    expect(setReviewResults).toHaveBeenCalledWith([{ id: '2' }]);
    expect(showError).toHaveBeenCalledWith('Failed to trigger AI review. It may have already been requested.');
  });

  it('handles error, handles refresh error and shows error', async () => {
    (responseApiClient.results.aiReviewCreate as any).mockRejectedValue(new Error('fail'));
    (responseApiClient.results.resultsDetail as any).mockRejectedValue(new Error('fail'));

    await triggerAiReview('sub1', setReviewResults, showSuccess, showError);

    expect(setReviewResults).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('Failed to trigger AI review. It may have already been requested.');
  });
});
