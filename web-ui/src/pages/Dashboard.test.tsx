import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {Dashboard} from './Dashboard';
import {configApiClient} from '../api/clients';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: {id: '1', username: 'testuser', roles: ['Author']},
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
        themeMode: 'system',
        setThemeMode: vi.fn(),
        mode: 'light',
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

vi.mock('../api/clients', () => ({
    configApiClient: {
        submissions: {
            authorDetail: vi.fn(() => Promise.resolve({data: []} as any)),
            submissionsDetail: vi.fn(() => Promise.resolve({data: {}} as any)),
            submissionsCreate: vi.fn(() => Promise.resolve({ok: true})),
        }
    },
    matchingApiClient: {
        matches: {
            getMatchesByExaminer: vi.fn(() => Promise.resolve({data: {assignments: []}})),
        }
    },
    submissionApiClient: {
        submissions: {
            getSubmission: vi.fn(() => Promise.resolve({data: {}} as any)),
        }
    },
    responseApiClient: {
        results: {
            resultsDetail: vi.fn(() => Promise.resolve({data: []} as any)),
        }
    },
    usersApiClient: {
        groups: {
            listGroupMembers: vi.fn(() => Promise.resolve({data: []} as any)),
        },
        users: {
            searchUsers: vi.fn(() => Promise.resolve({data: []} as any)),
        }
    }
}));

vi.mock('../hooks/useGroupMembers', () => ({
    useGroupMembers: vi.fn(() => ({
        members: [],
        loading: false,
        error: null,
    })),
}));

vi.mock('../hooks/useWorkflowPlugins', () => ({
    useWorkflowPlugins: vi.fn(() => ({
        plugins: [],
        types: [],
        templates: [],
        loading: false,
        error: null,
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

vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@mui/material')>();
    return {
        ...actual,
        useMediaQuery: vi.fn().mockReturnValue(false),
    };
});

describe('Dashboard Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderDashboard = () => {
        return render(
            <MemoryRouter>
                <ThemeProvider theme={theme}>
                    <Dashboard/>
                </ThemeProvider>
            </MemoryRouter>
        );
    };

    it('renders welcome message and lists tasks correctly', async () => {
        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValueOnce({
            data: [
                {
                    id: 'sub-1',
                    title: 'Test Submission',
                    submissionDeadline: new Date(Date.now() + 86400000).toISOString(),
                }
            ]
        } as any);

        renderDashboard();

        expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test Submission')).toBeInTheDocument();
            expect(screen.getByText('Submission')).toBeInTheDocument();
        });
    });

    it('handles empty tasks state correctly', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('You have no upcoming tasks.')).toBeInTheDocument();
        });
    });

    it('opens submission modal when "Create Submission" is clicked', async () => {
        renderDashboard();

        const createBtn = screen.getByText('Create Submission');
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    });
});
