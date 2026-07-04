import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {Admin} from './Admin';
import {useAuth} from '../contexts/AuthContext';
import {searchUsers} from '../api/communication';

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

vi.mock('../api/communication', () => ({
    searchUsers: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../hooks/useWorkflowPlugins', () => ({
    useWorkflowPlugins: vi.fn(() => ({
        types: [{name: 'TestType', title: 'Test Type', description: 'Test Desc'}],
        templates: [],
        loading: false,
    })),
}));

vi.mock('../hooks/useTopicTags', () => ({
    useTopicTags: vi.fn(() => ({
        topicTags: [],
        loading: false,
        addTag: vi.fn(),
        deleteTag: vi.fn(),
    })),
}));

describe('Admin Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderAdmin = () => {
        return render(
            <MemoryRouter>
                <ThemeProvider theme={theme}>
                    <Admin/>
                </ThemeProvider>
            </MemoryRouter>
        );
    };

    it('renders dashboard components for Admin role', async () => {
        vi.mocked(searchUsers).mockResolvedValueOnce([{id: '1', username: 'testuser'}] as any);
        renderAdmin();

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument(); // 1 user count
            expect(screen.getByText('TestType')).toBeInTheDocument();
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

        renderAdmin();
        await waitFor(() => {
            expect(screen.getByTestId('navigate')).toHaveTextContent('/dashboard');
        });
    });
});
