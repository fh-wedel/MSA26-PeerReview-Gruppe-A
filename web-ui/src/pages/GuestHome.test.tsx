import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {GuestHome} from './GuestHome';
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

describe('GuestHome', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <MemoryRouter>
                    <GuestHome/>
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
            signup: vi.fn(),
        });

        renderComponent();

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        // Ensure buttons are not rendered
        expect(screen.queryByRole('button', {name: /sign in/i})).not.toBeInTheDocument();
        expect(screen.queryByRole('button', {name: /register/i})).not.toBeInTheDocument();
    });

    it('renders correctly and shows action buttons if not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: false,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();

        expect(mockNavigate).not.toHaveBeenCalled();

        // Verify main texts
        expect(screen.getByText('Welcome to Peer Review')).toBeInTheDocument();
        expect(screen.getByText('Academic Excellence')).toBeInTheDocument();
        expect(screen.getByText('Structured Reviews')).toBeInTheDocument();
        expect(screen.getByText('Direct Communication')).toBeInTheDocument();

        // Verify buttons and simulate clicks
        const signInButton = screen.getByRole('button', {name: /sign in/i});
        const registerButton = screen.getByRole('button', {name: /register/i});

        expect(signInButton).toBeInTheDocument();
        expect(registerButton).toBeInTheDocument();

        fireEvent.click(signInButton);
        expect(mockNavigate).toHaveBeenCalledWith('/login');

        fireEvent.click(registerButton);
        expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
});
