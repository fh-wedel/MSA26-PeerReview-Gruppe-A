import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {GuestLayout} from './GuestLayout';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({pathname: '/'}),
        Outlet: () => <div data-testid="mock-outlet">Mock Outlet</div>,
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        isAuthenticated: false,
        loading: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        signup: vi.fn(),
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

describe('GuestLayout', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <MemoryRouter>
                    <GuestLayout/>
                </MemoryRouter>
            </ThemeProvider>
        );
    };

    it('renders Navbar, Outlet, and Footer', () => {
        renderComponent();

        // Verify Navbar is rendered
        expect(screen.getByText('Peer Review System')).toBeInTheDocument();

        // Verify Outlet is rendered
        expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();

        // Verify Footer is rendered
        expect(screen.getByText(/©.*Peer Review System/i)).toBeInTheDocument();
    });
});
