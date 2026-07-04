import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {AuthLayout} from './AuthLayout';
import {useAuth} from '../contexts/AuthContext';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({pathname: '/dashboard'}),
        Navigate: ({to}: { to: string }) => <div data-testid="mock-navigate" data-to={to}/>,
        Outlet: () => <div data-testid="mock-outlet">Mock Outlet</div>,
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
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
        setThemeMode: vi.fn(),
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

describe('AuthLayout', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <MemoryRouter>
                    <AuthLayout/>
                </MemoryRouter>
            </ThemeProvider>
        );
    };

    it('renders a loading spinner when loading is true', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: true,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-navigate')).not.toBeInTheDocument();
        expect(screen.queryByTestId('mock-outlet')).not.toBeInTheDocument();
    });

    it('renders Navigate to /login when not authenticated and not loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            loading: false,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();
        const navigate = screen.getByTestId('mock-navigate');
        expect(navigate).toBeInTheDocument();
        expect(navigate).toHaveAttribute('data-to', '/login');
    });

    it('renders Navbar, Outlet, and Footer when authenticated', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: {id: '1', email: 'test@test.com', username: 'testuser', roles: ['Author']},
            login: vi.fn(),
            logout: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();
        await waitFor(() => {
            // Verify Navbar is rendered by checking one of its texts
            expect(screen.getByText('Peer Review System')).toBeInTheDocument();
            // Verify Outlet is rendered
            expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();
            // Verify Footer is rendered
            expect(screen.getByText(/©.*Peer Review System/i)).toBeInTheDocument();
        });
    });
});
