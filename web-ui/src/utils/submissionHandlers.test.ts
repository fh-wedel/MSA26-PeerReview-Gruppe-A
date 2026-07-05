import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSubmissionModalSubmit } from './submissionHandlers';

describe('handleSubmissionModalSubmit', () => {
  const setHasAttemptedSubmit = vi.fn();
  const validateSubmission = vi.fn();
  const setValidationError = vi.fn();
  const setSubmitting = vi.fn();
  const onSubmit = vi.fn();
  const setTitle = vi.fn();
  const setReviewType = vi.fn();
  const setTopicTag = vi.fn();
  const setSelectedAuthors = vi.fn();
  const setSelectedCustomReviewers = vi.fn();
  const setReviewTemplateType = vi.fn();
  const onClose = vi.fn();
  const setErrorOpen = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('sets validation error if validation fails', async () => {
    validateSubmission.mockReturnValue('err');
    await handleSubmissionModalSubmit(
      false, setHasAttemptedSubmit, validateSubmission, [], [], 1, null,
      setValidationError, setSubmitting, onSubmit, 'title', 'rt', 'rt2', new Date(), new Date(), 'tag',
      setTitle, setReviewType, setTopicTag, setSelectedAuthors, setSelectedCustomReviewers,
      setReviewTemplateType, false, '1', 'bob', onClose, setErrorOpen
    );
    expect(setValidationError).toHaveBeenCalledWith('err');
    expect(setSubmitting).not.toHaveBeenCalled();
  });

  it('returns if disabled', async () => {
    validateSubmission.mockReturnValue('');
    await handleSubmissionModalSubmit(
      true, setHasAttemptedSubmit, validateSubmission, [], [], 1, null,
      setValidationError, setSubmitting, onSubmit, 'title', 'rt', 'rt2', new Date(), new Date(), 'tag',
      setTitle, setReviewType, setTopicTag, setSelectedAuthors, setSelectedCustomReviewers,
      setReviewTemplateType, false, '1', 'bob', onClose, setErrorOpen
    );
    expect(setSubmitting).not.toHaveBeenCalled();
  });

  it('submits successfully and resets state', async () => {
    validateSubmission.mockReturnValue('');
    onSubmit.mockResolvedValue({});
    await handleSubmissionModalSubmit(
      false, setHasAttemptedSubmit, validateSubmission, [{id:'1'}], [], 1, null,
      setValidationError, setSubmitting, onSubmit, 'title', 'rt', 'rt2', new Date(), new Date(), 'tag',
      setTitle, setReviewType, setTopicTag, setSelectedAuthors, setSelectedCustomReviewers,
      setReviewTemplateType, false, '1', 'bob', onClose, setErrorOpen
    );
    expect(onSubmit).toHaveBeenCalled();
    expect(setTitle).toHaveBeenCalledWith('');
    expect(onClose).toHaveBeenCalled();
  });

  it('handles error', async () => {
    validateSubmission.mockReturnValue('');
    onSubmit.mockRejectedValue(new Error('fail'));
    await handleSubmissionModalSubmit(
      false, setHasAttemptedSubmit, validateSubmission, [{id:'1'}], [], 1, null,
      setValidationError, setSubmitting, onSubmit, 'title', 'rt', 'rt2', new Date(), new Date(), 'tag',
      setTitle, setReviewType, setTopicTag, setSelectedAuthors, setSelectedCustomReviewers,
      setReviewTemplateType, false, '1', 'bob', onClose, setErrorOpen
    );
    expect(setErrorOpen).toHaveBeenCalledWith(true);
    expect(setSubmitting).toHaveBeenCalledWith(false);
  });
});
