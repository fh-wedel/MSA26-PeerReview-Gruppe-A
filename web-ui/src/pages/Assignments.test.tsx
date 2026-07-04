import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {Assignments} from './Assignments';
import {useAuth} from '../contexts/AuthContext';
import {useAssignments} from '../hooks/useAssignments';
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

vi.mock('../hooks/useAssignments', () => ({
    useAssignments: vi.fn(),
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

describe('Assignments Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'reviewer@test.com', username: 'reviewer', roles: ['Reviewer']},
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

        vi.mocked(useAssignments).mockReturnValue({
            assignments: [],
            loading: false,
            error: null,
        });

        vi.mocked(configApiClient.submissions.submissionsDetail).mockResolvedValue({data: {}});
        vi.mocked(matchingApiClient.matches.getMatchesBySubmission).mockResolvedValue({data: {}});
        vi.mocked(submissionApiClient.submissions.getSubmission).mockResolvedValue({data: {}});
        vi.mocked(responseApiClient.results.resultsDetail).mockResolvedValue({data: []});
    });

    const renderComponent = () => render(
        <ThemeProvider theme={theme}>
            <MemoryRouter>
                <Assignments/>
            </MemoryRouter>
        </ThemeProvider>
    );

    it('renders unauthenticated state when not reviewer/admin', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: '1', email: 'author@test.com', username: 'author', roles: ['Author']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        renderComponent();
        expect(screen.getByText('You are not authorized to view this page. This area is restricted to Administrators and Reviewers.')).toBeInTheDocument();
    });

    it('renders loading skeleton', () => {
        vi.mocked(useAssignments).mockReturnValue({
            assignments: [],
            loading: true,
            error: null,
        });

        renderComponent();
        // Skeleton can be tricky to query directly by text, but we can check the absence of "No assignments found"
        expect(screen.queryByText('You have no assignments at the moment.')).not.toBeInTheDocument();
    });

    it('renders error state', () => {
        vi.mocked(useAssignments).mockReturnValue({
            assignments: [],
            loading: false,
            error: new Error('Failed to fetch assignments'),
        });

        renderComponent();
        expect(screen.getByText('Failed to fetch assignments')).toBeInTheDocument();
    });

    it('renders empty assignments list', () => {
        renderComponent();
        expect(screen.getByText('You have no assignments at the moment.')).toBeInTheDocument();
    });

    it('renders assignment items and resolves API calls', async () => {
        vi.mocked(useAssignments).mockReturnValue({
            assignments: [{submissionId: 'sub1', assignedAt: new Date().toISOString()}],
            loading: false,
            error: null,
        });

        vi.mocked(configApiClient.submissions.submissionsDetail).mockResolvedValue({
            data: {title: 'Test Assignment 1', reviewProcessType: 'testPlugin', createdAt: new Date().toISOString()}
        } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Test Assignment 1')).toBeInTheDocument();
            expect(screen.getAllByText('Assigned').length).toBeGreaterThan(0);
        });
    });
});
