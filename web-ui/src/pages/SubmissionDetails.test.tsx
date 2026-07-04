import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {SubmissionDetails} from './SubmissionDetails';
import {useAuth} from '../contexts/AuthContext';
import {useNotification} from '../contexts/NotificationContext';
import {useUserResolver} from '../hooks/useUserResolver';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {configApiClient, configurationApiClient, responseApiClient, submissionApiClient} from '../api/clients';
import {fetchSubmissionMatch, fetchWorkflowRulesForSubmission} from '../api/communication';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({pathname: '/submissions/sub1'}),
        useParams: () => ({submissionId: 'sub1'}),
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../contexts/NotificationContext', () => ({
    useNotification: vi.fn(),
}));

vi.mock('../hooks/useUserResolver', () => ({
    useUserResolver: vi.fn(),
}));

vi.mock('../hooks/useWorkflowPlugins', () => ({
    useWorkflowPlugins: vi.fn(),
}));

vi.mock('../api/clients', () => ({
    configApiClient: {
        submissions: {
            submissionsDetail: vi.fn(),
        },
    },
    configurationApiClient: {
        submissions: {
            getFeedbackFormForSubmission: vi.fn(),
        },
    },
    submissionApiClient: {
        submissions: {
            getSubmission: vi.fn(),
            getDocuments: vi.fn(),
            getPresignedDownloadUrl: vi.fn(),
        },
    },
    responseApiClient: {
        results: {
            resultsDetail: vi.fn(),
            aiReviewCreate: vi.fn(),
        },
    },
}));

vi.mock('../api/communication', () => ({
    fetchSubmissionMatch: vi.fn(),
    fetchWorkflowRulesForSubmission: vi.fn(),
}));

describe('SubmissionDetails Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'author@test.com', username: 'author', roles: ['Author']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        vi.mocked(useNotification).mockReturnValue({
            showError: vi.fn(),
            showSuccess: vi.fn(),
            showInfo: vi.fn(),
            clearNotification: vi.fn(),
            notification: null,
        });

        vi.mocked(useUserResolver).mockReturnValue({
            resolveUserId: (id: string) => `User ${id}`,
            resolveUserIds: vi.fn(),
            loading: false,
        });

        vi.mocked(useWorkflowPlugins).mockReturnValue({
            plugins: [],
            types: [{name: 'testPlugin', title: 'Test Plugin', description: 'desc', version: '1.0', capabilities: []}],
            loading: false,
            error: null,
        });

        vi.mocked(configApiClient.submissions.submissionsDetail).mockResolvedValue({
            data: {
                title: 'Test Submission',
                createdAt: new Date().toISOString(),
                reviewProcessType: 'testPlugin',
                authorIds: ['1']
            }
        } as any);

        vi.mocked(submissionApiClient.submissions.getSubmission).mockResolvedValue({
            data: {status: 'SUBMITTED', submittedAt: new Date().toISOString()}
        } as any);

        vi.mocked(submissionApiClient.submissions.getDocuments).mockResolvedValue({data: []} as any);
        vi.mocked(responseApiClient.results.resultsDetail).mockResolvedValue({data: []} as any);
        vi.mocked(configurationApiClient.submissions.getFeedbackFormForSubmission).mockResolvedValue({data: []} as any);

        vi.mocked(fetchSubmissionMatch).mockResolvedValue({
            matches: [], status: 'MATCHED', matchedAt: new Date().toISOString(), submitterIds: ['1']
        });
        vi.mocked(fetchWorkflowRulesForSubmission).mockResolvedValue({
            authorReviewerChatAllowed: true, authorAnonymous: false, reviewerAnonymous: false
        });
    });

    const renderComponent = () => render(
        <ThemeProvider theme={theme}>
            <MemoryRouter>
                <SubmissionDetails/>
            </MemoryRouter>
        </ThemeProvider>
    );

    it('renders loading state initially', async () => {
        const {container} = renderComponent();
        expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Test Submission')).toBeInTheDocument();
        });
    });

    it('renders submission details after fetching', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Test Submission')).toBeInTheDocument();
            expect(screen.getByText('Submitted')).toBeInTheDocument();
            expect(screen.getByText('User 1')).toBeInTheDocument();
        });
    });

    it('displays chat button as enabled for author if rules allow', async () => {
        renderComponent();
        await waitFor(() => {
            const chatBtn = screen.getByRole('button', {name: /Submission Chat/i});
            expect(chatBtn).not.toBeDisabled();
        });
    });

    it('displays AI review processing if AI review is processing', async () => {
        vi.mocked(responseApiClient.results.resultsDetail).mockResolvedValue({
            data: [{isAiGenerated: true, aiStatus: 'PROCESSING'}]
        } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('AI Review Status')).toBeInTheDocument();
            expect(screen.getByText('The AI is currently processing this submission.')).toBeInTheDocument();
        });
    });
});
