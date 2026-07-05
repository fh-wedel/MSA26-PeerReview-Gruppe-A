import { describe, it, expect } from 'vitest';
import { validateSubmission, checkIsSubmitDisabled, validateAuthorsChange } from './submissionValidation';
import type { UserSummary } from '../api/communication';

describe('submissionValidation', () => {
  const author: UserSummary = { id: '1', username: 'author1' };
  const reviewer: UserSummary = { id: '2', username: 'reviewer1' };

  describe('validateSubmission', () => {
    it('returns error if no authors', () => {
      expect(validateSubmission([], [], 1, null)).toBe('At least one author must be specified.');
    });

    it('returns error if custom reviewers mismatch', () => {
      expect(validateSubmission([author], [reviewer], 2, null)).toBe('You selected manual reviewers. Please select exactly 2 reviewer(s).');
    });

    it('returns error if maxAuthors exceeded', () => {
      expect(validateSubmission([author, author], [], 1, { maxAuthors: 1 })).toBe('At most 1 author(s) allowed for this template.');
    });

    it('returns error if minAuthors not met', () => {
      expect(validateSubmission([author], [], 1, { minAuthors: 2 })).toBe('At least 2 author(s) required for this template.');
    });

    it('returns null if valid', () => {
      expect(validateSubmission([author], [], 1, null)).toBeNull();
      expect(validateSubmission([author], [reviewer], 1, null)).toBeNull();
      expect(validateSubmission([author], [], 1, { minAuthors: 1, maxAuthors: 2 })).toBeNull();
    });
  });

  describe('checkIsSubmitDisabled', () => {
    it('disables if basic fields missing', () => {
      expect(checkIsSubmitDisabled('', 'tag', false, [author], [], 1, null)).toBe(true);
      expect(checkIsSubmitDisabled('title', '', false, [author], [], 1, null)).toBe(true);
      expect(checkIsSubmitDisabled('title', 'tag', true, [author], [], 1, null)).toBe(true);
      expect(checkIsSubmitDisabled('title', 'tag', false, [], [], 1, null)).toBe(true);
    });

    it('disables if custom reviewers mismatch', () => {
      expect(checkIsSubmitDisabled('title', 'tag', false, [author], [reviewer], 2, null)).toBe(true);
    });

    it('disables if maxAuthors exceeded', () => {
      expect(checkIsSubmitDisabled('title', 'tag', false, [author, author], [], 1, { maxAuthors: 1 })).toBe(true);
    });

    it('disables if minAuthors not met', () => {
      expect(checkIsSubmitDisabled('title', 'tag', false, [author], [], 1, { minAuthors: 2 })).toBe(true);
    });

    it('enables if valid', () => {
      expect(checkIsSubmitDisabled('title', 'tag', false, [author], [], 1, null)).toBe(false);
      expect(checkIsSubmitDisabled('title', 'tag', false, [author], [reviewer], 1, null)).toBe(false);
      expect(checkIsSubmitDisabled('title', 'tag', false, [author], [], 1, { minAuthors: 1, maxAuthors: 2 })).toBe(false);
    });
  });

  describe('validateAuthorsChange', () => {
    it('returns error if user removes themselves and is not admin', () => {
      expect(validateAuthorsChange([reviewer], '1', false, false, null)).toBe('You cannot remove yourself from this submission.');
    });

    it('returns empty if user removes themselves but is admin', () => {
      expect(validateAuthorsChange([reviewer], '1', true, false, null)).toBe('');
    });

    it('returns error if maxAuthors exceeded', () => {
      expect(validateAuthorsChange([author, reviewer], '1', false, false, { maxAuthors: 1 })).toBe('At most 1 author(s) allowed for this template.');
    });

    it('returns error if minAuthors not met', () => {
      expect(validateAuthorsChange([author], '1', false, false, { minAuthors: 2 })).toBe('At least 2 author(s) required for this template.');
    });

    it('returns empty string if valid', () => {
      expect(validateAuthorsChange([author], '1', false, false, null)).toBe('');
    });
  });
});
