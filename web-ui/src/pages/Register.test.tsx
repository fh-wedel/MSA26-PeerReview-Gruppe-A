import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {Register} from './Register';
import {useAuth} from '../contexts/AuthContext';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('Register', () => {
    const theme = createTheme();
    const mockSignup = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <MemoryRouter>
                    <Register/>
                </MemoryRouter>
            </ThemeProvider>
        );
    };

    it('navigates to /dashboard if authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: {id: '1', email: 'test@test.com', username: 'testuser', roles: ['Author']},
            login: vi.fn(),
            logout: vi.fn(),
            signup: mockSignup,
        });

        renderComponent();

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        expect(mockSignup).not.toHaveBeenCalled();
    });

    it('calls signup automatically if not authenticated and not loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: false,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
            signup: mockSignup,
        });

        renderComponent();

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockSignup).toHaveBeenCalledTimes(1);

        // Verify main texts
        expect(screen.getByText('Creating your Account')).toBeInTheDocument();

        // Verify manual signup button
        const retryButton = screen.getByRole('button', {name: /click here if not redirected/i});
        expect(retryButton).toBeInTheDocument();

        // Test manual click
        fireEvent.click(retryButton);
        expect(mockSignup).toHaveBeenCalledTimes(2);
    });

    it('does not call signup automatically if loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: true,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
            signup: mockSignup,
        });

        renderComponent();

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockSignup).not.toHaveBeenCalled();

        // Verify the loading indicator is shown (CircularProgress has role="progressbar" by default in MUI)
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
