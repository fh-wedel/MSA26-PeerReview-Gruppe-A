import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {UserManagement} from './UserManagement';
import {useAuth} from '../contexts/AuthContext';
import {fetchUserDetails, searchUsers} from '../api/users';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        Navigate: ({to}: { to: string }) => <div data-testid="navigate">{to}</div>,
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: {id: '1', username: 'adminuser', roles: ['Admin']},
        isAuthenticated: true,
    })),
}));

vi.mock('../api/users', () => ({
    searchUsers: vi.fn(() => Promise.resolve([])),
    fetchGroupMembers: vi.fn(() => Promise.resolve([])),
    addGroupMember: vi.fn(() => Promise.resolve({})),
    removeGroupMember: vi.fn(() => Promise.resolve()),
    updateUserAttributes: vi.fn(() => Promise.resolve({})),
    fetchUserDetails: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../api/clients', () => ({
    configurationApiClient: {
        topicTags: {
            listTopicTags: vi.fn(() => Promise.resolve({ok: true, data: []})),
        }
    }
}));

describe('UserManagement Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderUserManagement = () => {
        return render(
            <MemoryRouter>
                <ThemeProvider theme={theme}>
                    <UserManagement/>
                </ThemeProvider>
            </MemoryRouter>
        );
    };

    it('renders users list for Admin role', async () => {
        vi.mocked(searchUsers).mockResolvedValueOnce([{username: 'user1'}] as any);
        vi.mocked(fetchUserDetails).mockResolvedValueOnce({
            username: 'user1',
            email: 'user1@test.com',
            status: 'CONFIRMED',
            groups: ['Author']
        } as any);

        renderUserManagement();

        expect(screen.getByText('User Management')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('user1')).toBeInTheDocument();
            expect(screen.getByText('user1@test.com')).toBeInTheDocument();
        });
    });

    it('redirects non-admin users', async () => {
        vi.mocked(useAuth).mockReturnValue({
            user: {id: '2', username: 'authoruser', roles: ['Author']},
            isAuthenticated: true,
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn()
        });

        renderUserManagement();
        await waitFor(() => {
            expect(screen.getByTestId('navigate')).toHaveTextContent('/dashboard');
        });
    });
});
