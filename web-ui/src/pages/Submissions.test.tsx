import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {Submissions} from './Submissions';
import {useAuth} from '../contexts/AuthContext';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {configApiClient, matchingApiClient, responseApiClient, submissionApiClient} from '../api/clients';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../hooks/useWorkflowPlugins', () => ({
    useWorkflowPlugins: vi.fn(),
}));

vi.mock('../api/clients', () => ({
    configApiClient: {
        submissions: {
            authorDetail: vi.fn(),
            submissionsList: vi.fn(),
        },
    },
    matchingApiClient: {
        matches: {
            getMatchesBySubmission: vi.fn(),
        },
    },
    submissionApiClient: {
        submissions: {
            getSubmission: vi.fn(),
        },
    },
    responseApiClient: {
        results: {
            resultsDetail: vi.fn(),
        },
    },
}));

describe('Submissions Component', () => {
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

        vi.mocked(useWorkflowPlugins).mockReturnValue({
            plugins: [],
            types: [{name: 'testPlugin', title: 'Test Plugin', description: 'desc', version: '1.0', capabilities: []}],
            loading: false,
            error: null,
        });

        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValue({data: []} as any);
        vi.mocked(configApiClient.submissions.submissionsList).mockResolvedValue({data: []} as any);
        vi.mocked(matchingApiClient.matches.getMatchesBySubmission).mockResolvedValue({data: {}} as any);
        vi.mocked(submissionApiClient.submissions.getSubmission).mockResolvedValue({data: {}} as any);
        vi.mocked(responseApiClient.results.resultsDetail).mockResolvedValue({data: []} as any);
    });

    const renderComponent = () => render(
        <ThemeProvider theme={theme}>
            <MemoryRouter>
                <Submissions/>
            </MemoryRouter>
        </ThemeProvider>
    );

    it('renders unauthenticated / no access state', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'reviewer@test.com', username: 'reviewer', roles: ['Reviewer']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();
        expect(screen.getByText(/You are not authorized to view this page/)).toBeInTheDocument();
    });

    it('renders empty submissions for Author', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByText('You have no submissions.')).toBeInTheDocument();
        });
    });

    it('renders submissions list for Author', async () => {
        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValue({
            data: [{
                id: 'sub1',
                title: 'My Submission',
                createdAt: new Date().toISOString(),
                reviewProcessType: 'testPlugin'
            }]
        } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('My Submission')).toBeInTheDocument();
            expect(screen.getAllByText('Created').length).toBeGreaterThan(0);
        });
    });

    it('renders submissions overview for Admin', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'admin@test.com', username: 'admin', roles: ['Admin']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValue({data: []} as any);
        vi.mocked(configApiClient.submissions.submissionsList).mockResolvedValue({
            data: [{
                id: 'sub2',
                title: 'Other Submission',
                createdAt: new Date().toISOString(),
                reviewProcessType: 'testPlugin'
            }]
        } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Submissions Overview')).toBeInTheDocument();
            expect(screen.getByText('Other Submission')).toBeInTheDocument();
            expect(screen.getAllByText('Created').length).toBeGreaterThan(0);
        });
    });
});
