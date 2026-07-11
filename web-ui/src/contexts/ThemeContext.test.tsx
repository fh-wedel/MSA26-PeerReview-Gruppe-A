import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {CustomThemeProvider, useThemeContext} from './ThemeContext';
import * as mui from '@mui/material';

// Mock useMediaQuery to control system preference
vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@mui/material')>();
    return {
        ...actual,
        useMediaQuery: vi.fn(),
    };
});

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const wrapper = ({children}: { children: React.ReactNode }) => (
        <CustomThemeProvider>{children}</CustomThemeProvider>
    );

    it('defaults to system preference', () => {
        vi.mocked(mui.useMediaQuery).mockReturnValue(true); // prefers dark

        const {result} = renderHook(() => useThemeContext(), {wrapper});

        expect(result.current.themeMode).toBe('system');
        expect(result.current.mode).toBe('dark');
    });

    it('loads saved preference from localStorage', () => {
        localStorage.setItem('themeMode', 'light');
        vi.mocked(mui.useMediaQuery).mockReturnValue(true); // prefers dark

        const {result} = renderHook(() => useThemeContext(), {wrapper});

        expect(result.current.themeMode).toBe('light');
        expect(result.current.mode).toBe('light');
    });

    it('setThemeMode updates state and localStorage', () => {
        vi.mocked(mui.useMediaQuery).mockReturnValue(false); // prefers light

        const {result} = renderHook(() => useThemeContext(), {wrapper});

        expect(result.current.themeMode).toBe('system');

        act(() => {
            result.current.setThemeMode('dark');
        });

        expect(result.current.themeMode).toBe('dark');
        expect(result.current.mode).toBe('dark');
        expect(localStorage.getItem('themeMode')).toBe('dark');
    });
});
