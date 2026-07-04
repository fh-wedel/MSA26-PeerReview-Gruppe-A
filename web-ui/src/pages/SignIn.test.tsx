import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {SignIn} from './SignIn';
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

describe('SignIn', () => {
    const theme = createTheme();
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <MemoryRouter>
                    <SignIn/>
                </MemoryRouter>
            </ThemeProvider>
        );
    };

    it('navigates to /dashboard if authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: {id: '1', email: 'test@test.com', username: 'testuser', roles: ['Author']},
            login: mockLogin,
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('calls login automatically if not authenticated and not loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: false,
            user: null,
            login: mockLogin,
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockLogin).toHaveBeenCalledTimes(1);

        // Verify main texts
        expect(screen.getByText('Redirecting to Secure Login')).toBeInTheDocument();

        // Verify manual login button
        const retryButton = screen.getByRole('button', {name: /click here if not redirected/i});
        expect(retryButton).toBeInTheDocument();

        // Test manual click
        fireEvent.click(retryButton);
        expect(mockLogin).toHaveBeenCalledTimes(2);
    });

    it('does not call login automatically if loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: true,
            user: null,
            login: mockLogin,
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockLogin).not.toHaveBeenCalled();

        // Verify the loading indicator is shown (CircularProgress has role="progressbar" by default in MUI)
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
