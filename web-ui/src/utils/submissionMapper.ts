import { matchingApiClient, submissionApiClient, responseApiClient } from '../api/clients';

const determineMatchStatus = (matchData: any) => {
  let status = 'Created';
  let reviewerId: string | undefined = undefined;
  let matchedAt: string | undefined = undefined;

  if (matchData) {
    if (matchData.status === 'MATCHED') {
      status = 'Matched';
      reviewerId = matchData.matches?.[0]?.examinerId;
      matchedAt = matchData.matchedAt;
    } else if (matchData.status === 'FAILED') {
      status = 'Failed';
      matchedAt = matchData.matchedAt;
    }
  }
  return { status, reviewerId, matchedAt };
};

export const getSubmissionStatusStr = (subData: any) => {
  if (subData.status === 'SUBMITTED') return 'Submitted';
  if (subData.status === 'READY_FOR_REVIEW') return 'Ready for Review';
  if (subData.status === 'WAITING_FOR_SUBMISSION') return 'Waiting for Submission';
  if (subData.status === 'DRAFT') return 'Draft';
  return undefined;
};

const determineReviewStatus = (results: any[], expectedHumanReviews: number) => {
  const humanCompletedCount = results.filter(r => !r.isAiGenerated).length;
  const aiProcessing = results.some(r => r.isAiGenerated && (r.aiStatus === 'REQUESTED' || r.aiStatus === 'PROCESSING'));
  const aiFailed = results.some(r => r.isAiGenerated && r.aiStatus === 'FAILED');
  const aiCompleted = results.some(r => r.isAiGenerated && r.aiStatus === 'COMPLETED');

  if (expectedHumanReviews > 0 && humanCompletedCount >= expectedHumanReviews) {
    if (aiProcessing) return 'All Human Reviews Completed (AI Processing)';
    if (aiFailed) return 'All Human Reviews Completed (AI Failed)';
    if (aiCompleted) return 'All Reviews Completed';
    return 'All Human Reviews Completed';
  } else if (humanCompletedCount > 0 && expectedHumanReviews > 0) {
    return `${humanCompletedCount} / ${expectedHumanReviews} Human Reviews Completed`;
  } else if (aiProcessing) {
    return 'AI Review Processing';
  } else if (aiFailed) {
    return 'AI Review Failed';
  } else if (aiCompleted) {
    return 'AI Review Completed';
  } else if (humanCompletedCount > 0) {
    return 'Review Completed';
  }
  return undefined;
};

const getLatestTime = (createdAt: string, matchedAt?: string, submissionUpdatedAt?: string) => {
  let updateTime = createdAt;
  if (matchedAt && new Date(matchedAt) > new Date(updateTime)) {
    updateTime = matchedAt;
  }
  if (submissionUpdatedAt && new Date(submissionUpdatedAt) > new Date(updateTime)) {
    updateTime = submissionUpdatedAt;
  }
  return updateTime;
};

export const mapConfigToDisplay = async (config: any) => {
  const id = config.id || config.submissionId;
  let status = 'Created';
  let reviewerId: string | undefined = undefined;
  let matchedAt: string | undefined = undefined;
  let expectedHumanReviews = 0;

  try {
    const matchRes = await matchingApiClient.matches.getMatchesBySubmission(id);
    const matchData: any = (matchRes as any).data;
    if (matchData) {
      expectedHumanReviews = matchData.matches?.length || matchData.numberOfExaminers || 0;
      const matchStatus = determineMatchStatus(matchData);
      if (matchStatus.status !== 'Created') status = matchStatus.status;
      reviewerId = matchStatus.reviewerId;
      matchedAt = matchStatus.matchedAt;
    }
  } catch (e) {
    // Not matched yet or 404
  }

  let submissionUpdatedAt: string | undefined = undefined;
  try {
    const subRes = await submissionApiClient.submissions.getSubmission(id);
    const subData = (subRes as any)?.data;
    if (subData?.status) {
      const subStatusStr = getSubmissionStatusStr(subData);
      if (subStatusStr) status = subStatusStr;
      submissionUpdatedAt = subData.updatedAt;
    }
  } catch (e) {
    // No submission yet
  }

  try {
    const resResult = await responseApiClient.results.resultsDetail(id);
    if (resResult?.data) {
      const reviewStatusStr = determineReviewStatus(resResult.data, expectedHumanReviews);
      if (reviewStatusStr) status = reviewStatusStr;
    }
  } catch (e) {
    // No review yet
  }

  if (!config.createdAt) {
    throw new Error(`Submission ${id} is missing a creation date from the backend.`);
  }

  return {
    id,
    title: config.title || 'Untitled',
    createdAt: config.createdAt,
    updateTime: getLatestTime(config.createdAt, matchedAt, submissionUpdatedAt),
    status,
    reviewerId,
    reviewProcessType: config.reviewProcessType,
    numberOfExaminers: config.numberOfExaminers
  };
};
