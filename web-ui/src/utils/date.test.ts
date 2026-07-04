import {describe, expect, it} from 'vitest';
import {formatDateTime} from './date';

describe('date utils', () => {
    describe('formatDateTime', () => {
        it('returns formatted date for valid ISO string', () => {
            const date = new Date('2024-01-01T12:00:00Z');
            const isoString = date.toISOString();
            const result = formatDateTime(isoString, 'yyyy-MM-dd HH:mm');
            expect(result).toMatch(/^2024-01-01 \d{2}:\d{2}$/);
            expect(result).not.toBe('Not available');
        });

        it('returns fallback for empty string', () => {
            expect(formatDateTime('')).toBe('Not available');
        });

        it('returns fallback for invalid date string', () => {
            expect(formatDateTime('invalid-date')).toBe('Not available');
        });

        it('uses custom fallback when provided', () => {
            expect(formatDateTime('', 'PPPp', 'N/A')).toBe('N/A');
        });
    });
});
