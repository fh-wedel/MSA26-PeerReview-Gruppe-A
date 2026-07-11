import { describe, it, expect } from 'vitest';
import { calculateSubmissionDefaults } from './submissionDefaults';

describe('submissionDefaults', () => {
  const now = new Date('2023-01-01T00:00:00Z');
  
  it('calculates defaults with no active template settings', () => {
    const result = calculateSubmissionDefaults({}, 'user1', 'User One', false, 1, now);
    expect(result.numberOfReviewers).toBe(1);
    expect(result.submissionDeadline.toISOString()).toBe('2023-01-15T00:00:00.000Z');
    expect(result.reviewDeadline.toISOString()).toBe('2023-01-29T00:00:00.000Z');
    expect(result.selectedAuthors).toBeUndefined();
  });

  it('uses template settings for reviewers and deadlines', () => {
    const template = {
      minReviewers: 3,
      submissionDurationDays: 7,
      reviewDurationDays: 14
    };
    const result = calculateSubmissionDefaults(template, 'user1', 'User One', false, 1, now);
    expect(result.numberOfReviewers).toBe(3);
    expect(result.submissionDeadline.toISOString()).toBe('2023-01-08T00:00:00.000Z');
    expect(result.reviewDeadline.toISOString()).toBe('2023-01-22T00:00:00.000Z');
  });

  it('updates selectedAuthors if fixed to 1 and user is not admin', () => {
    const template = { minAuthors: 1, maxAuthors: 1 };
    const result = calculateSubmissionDefaults(template, 'user1', 'User One', false, 0, now);
    expect(result.selectedAuthors).toEqual([{ id: 'user1', username: 'User One' }]);
  });

  it('does not update selectedAuthors if fixed to 1 but already length 1 (not admin)', () => {
    const template = { minAuthors: 1, maxAuthors: 1 };
    const result = calculateSubmissionDefaults(template, 'user1', 'User One', false, 1, now);
    expect(result.selectedAuthors).toBeUndefined();
  });

  it('updates selectedAuthors to empty if fixed to 1 and user is admin but has >1 authors', () => {
    const template = { minAuthors: 1, maxAuthors: 1 };
    const result = calculateSubmissionDefaults(template, 'user1', 'User One', true, 2, now);
    expect(result.selectedAuthors).toEqual([]);
  });

  it('does not update selectedAuthors if fixed to 1 and user is admin and has 1 author', () => {
    const template = { minAuthors: 1, maxAuthors: 1 };
    const result = calculateSubmissionDefaults(template, 'user1', 'User One', true, 1, now);
    expect(result.selectedAuthors).toBeUndefined();
  });
});
