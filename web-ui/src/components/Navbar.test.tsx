import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {Navbar} from './Navbar';
import {useAuth} from '../contexts/AuthContext';

// Mock all external dependencies
const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockSetThemeMode = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({pathname: '/dashboard'}),
}));

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        isAuthenticated: false,
        user: null,
        logout: mockLogout,
    })),
}));

vi.mock('../contexts/ChatContext', () => ({
    useChat: vi.fn(() => ({
        chats: [],
        unreadCount: 0,
    })),
}));

vi.mock('../contexts/ThemeContext', () => ({
    useThemeContext: vi.fn(() => ({
        themeMode: 'system' as const,
        setThemeMode: mockSetThemeMode,
        mode: 'light' as const,
    })),
}));

vi.mock('../api/notification', () => ({
    fetchNotifications: vi.fn(() => Promise.resolve([])),
    markNotificationRead: vi.fn(() => Promise.resolve()),
    markAllNotificationsRead: vi.fn(() => Promise.resolve()),
    streamNotifications: vi.fn(() => ({abort: vi.fn()})),
}));

vi.mock('../api/communication', () => ({
    searchUsers: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@mui/material')>();
    return {
        ...actual,
        useMediaQuery: vi.fn().mockReturnValue(false), // Simulate desktop view
    };
});

describe('Navbar component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderNavbar = () => {
        return render(
            <ThemeProvider theme={theme}>
                <Navbar/>
            </ThemeProvider>
        );
    };

    it('shows Sign In button when not authenticated', async () => {
        renderNavbar();
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toBeInTheDocument();

        // Check title
        expect(screen.getByText('Peer Review System')).toBeInTheDocument();

        // Check no nav links
        expect(screen.queryByText('Home')).not.toBeInTheDocument();
        expect(screen.queryByText('Submissions')).not.toBeInTheDocument();

        fireEvent.click(signInButton);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('shows full navigation for Admin role', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'admin@test.com', username: 'admin', roles: ['Admin']},
            logout: mockLogout,
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderNavbar();

        await waitFor(() => {
            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Assignments')).toBeInTheDocument();
            expect(screen.getByText('Submissions')).toBeInTheDocument();
            expect(screen.getByText('Users')).toBeInTheDocument();
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });

        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();

        // Icons
        expect(screen.getByTestId('NotificationsIcon')).toBeInTheDocument();
        expect(screen.getByTestId('MailIcon')).toBeInTheDocument();
    });

    it('shows limited navigation for Author role', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'author@test.com', username: 'author', roles: ['Author']},
            logout: mockLogout,
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderNavbar();

        await waitFor(() => {
            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Submissions')).toBeInTheDocument();
        });

        expect(screen.queryByText('Assignments')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
        expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });

    it('shows limited navigation for Reviewer role', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'reviewer@test.com', username: 'reviewer', roles: ['Reviewer']},
            logout: mockLogout,
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderNavbar();

        await waitFor(() => {
            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Assignments')).toBeInTheDocument();
        });

        expect(screen.queryByText('Submissions')).not.toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
        expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });

    it('handles profile menu interactions', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'test@test.com', username: 'testuser', roles: ['Author']},
            logout: mockLogout,
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderNavbar();

        await waitFor(() => {
            // Open profile menu
            const profileButton = screen.getByTestId('AccountCircleIcon').closest('button');
            fireEvent.click(profileButton!);
        });

        // Check menu item
        expect(screen.getByText('Author: testuser')).toBeInTheDocument();

        // Click logout
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('handles theme toggle', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            user: null,
            logout: mockLogout,
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderNavbar();

        // Open theme menu
        const themeButton = screen.getByTestId('SettingsBrightnessIcon').closest('button');
        fireEvent.click(themeButton!);

        // Check options
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
        expect(screen.getByText('System')).toBeInTheDocument();

        // Click Light
        fireEvent.click(screen.getByText('Light'));
        expect(mockSetThemeMode).toHaveBeenCalledWith('light');
    });
});
