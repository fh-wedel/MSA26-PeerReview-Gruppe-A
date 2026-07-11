import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {ChatPage} from './ChatPage';
import {useAuth} from '../contexts/AuthContext';
import {useChat} from '../contexts/ChatContext';
import {searchUsers} from '../api/communication';
import {configApiClient} from '../api/clients';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({search: '?tab=general', pathname: '/chats'}),
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../contexts/ChatContext', () => ({
    useChat: vi.fn(),
}));

vi.mock('../api/clients', () => ({
    configApiClient: {
        submissions: {
            submissionsDetail: vi.fn(),
        },
    },
    communicationApiClient: {
        chat: {
            getChatHistory: vi.fn(),
        },
    },
}));

vi.mock('../api/communication', () => ({
    searchUsers: vi.fn(),
}));

describe('ChatPage Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'user@test.com', username: 'user', roles: ['Author']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        vi.mocked(useChat).mockReturnValue({
            chats: [],
            unreadCount: 0,
            sendMessage: vi.fn(),
            markChatRead: vi.fn(),
        } as any);

        vi.mocked(searchUsers).mockResolvedValue([]);
        vi.mocked(configApiClient.submissions.submissionsDetail).mockResolvedValue({data: {}} as any);
    });

    const renderComponent = () => render(
        <ThemeProvider theme={theme}>
            <MemoryRouter>
                <ChatPage/>
            </MemoryRouter>
        </ThemeProvider>
    );

    it('renders chat layout with general and submission tabs', async () => {
        renderComponent();
        expect(screen.getByText('Chats')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('tab', {name: 'General'})).toBeInTheDocument();
            expect(screen.getByRole('tab', {name: 'Submissions'})).toBeInTheDocument();
            expect(screen.getByText('Select a chat or start a new one')).toBeInTheDocument();
        });
    });

    it('renders list of general chats', async () => {
        vi.mocked(useChat).mockReturnValue({
            chats: [
                {
                    chatId: 'chat1',
                    chatType: 'GENERAL',
                    otherParticipantId: 'user2',
                    lastMessageAt: new Date().toISOString()
                },
            ],
            unreadCount: 0,
        } as any);

        vi.mocked(searchUsers).mockResolvedValue([
            {id: 'user2', username: 'john_doe', email: 'john@example.com',}
        ]);

        renderComponent();

        await waitFor(() => {
            // It should display the username from the search map
            expect(screen.getByText('john_doe')).toBeInTheDocument();
        });
    });

    it('renders list of submission chats', async () => {
        vi.mocked(useChat).mockReturnValue({
            chats: [
                {
                    chatId: 'chat2',
                    chatType: 'SUBMISSION',
                    submissionId: 'sub123',
                    lastMessageAt: new Date().toISOString()
                },
            ],
            unreadCount: 0,
        } as any);

        vi.mocked(configApiClient.submissions.submissionsDetail).mockResolvedValue({
            data: {title: 'Test Project'}
        } as any);

        renderComponent();

        const submissionTab = screen.getByRole('tab', {name: 'Submissions'});
        fireEvent.click(submissionTab);

        await waitFor(() => {
            expect(screen.getByText('Submission: Test Project')).toBeInTheDocument();
        });
    });
});
