import { responseApiClient } from '../api/clients';

export const triggerAiReview = async (
  submissionId: string,
  setReviewResults: (results: any) => void,
  showSuccess: (msg: string) => void,
  showError: (msg: string) => void
) => {
  if (!submissionId) return;
  try {
    await responseApiClient.results.aiReviewCreate(submissionId);
    const refreshed = await responseApiClient.results.resultsDetail(submissionId);
    if (refreshed?.data) {
      setReviewResults(refreshed.data);
    }
    showSuccess('AI Review requested successfully!');
  } catch (e) {
    console.error('Failed to trigger AI review', e);
    try {
      const refreshed = await responseApiClient.results.resultsDetail(submissionId);
      if (refreshed?.data) {
        setReviewResults(refreshed.data);
      }
    } catch {
      // ignore refresh errors; preserve original trigger error feedback
    }
    showError('Failed to trigger AI review. It may have already been requested.');
  }
};
