import { describe, it, expect } from 'vitest';
import { getChatTitle } from './chatHelpers';

describe('getChatTitle', () => {
  it('returns chat title for GENERAL chat type', () => {
    expect(getChatTitle('GENERAL', null, null, [], {}, { '1': 'Alice' }, '1')).toBe('Chat with Alice');
    expect(getChatTitle('GENERAL', null, null, [], {}, {}, '1')).toBe('Chat with 1');
  });

  it('returns chat title for SUBMISSION chat type', () => {
    const filteredChats = [{ chatId: 'c1', submissionId: 's1' }];
    expect(getChatTitle('SUBMISSION', 'c1', null, filteredChats, { 's1': 'My Sub' }, {}, null)).toBe('Submission Chat: My Sub');
    expect(getChatTitle('SUBMISSION', 'c1', null, filteredChats, {}, {}, null)).toBe('Submission Chat: s1');
    expect(getChatTitle('SUBMISSION', null, 's2', filteredChats, { 's2': 'Pending Sub' }, {}, null)).toBe('Submission Chat: Pending Sub');
    expect(getChatTitle('SUBMISSION', 'c2', null, filteredChats, {}, {}, null)).toBe('Submission Chat: Unknown Submission');
  });
});
