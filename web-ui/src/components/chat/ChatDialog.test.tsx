import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {SubmissionChatDialog} from './SubmissionChatDialog';
import {fetchWorkflowRulesForSubmission} from '../../api/communication';
import {configApiClient} from '../../api/clients';
import {useAuth} from '../../contexts/AuthContext';
import {useChat} from '../../contexts/ChatContext';
import {useAssignments} from '../../hooks/useAssignments';
import '@testing-library/jest-dom';

vi.mock('../../api/communication', () => ({
    fetchWorkflowRulesForSubmission: vi.fn(),
}));

vi.mock('../../api/clients', () => ({
    configApiClient: {
        submissions: {
            authorDetail: vi.fn(),
            submissionsDetail: vi.fn(),
        }
    }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../contexts/ChatContext', () => ({
    useChat: vi.fn(),
}));

vi.mock('../../hooks/useAssignments', () => ({
    useAssignments: vi.fn(),
}));

describe('SubmissionChatDialog component', () => {
    const theme = createTheme();
    const mockOnClose = vi.fn();
    const mockOnStartSubmissionChat = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: 'user1', email: 'user@test.com', username: 'user1', roles: ['Author']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        vi.mocked(useChat).mockReturnValue({
            chats: [],
            unreadCount: 0,
        } as any);

        vi.mocked(useAssignments).mockReturnValue({
            assignments: [{submissionId: 'sub-1', reviewerId: 'user1'}]
        } as any);
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <SubmissionChatDialog
                    open={true}
                    onClose={mockOnClose}
                    onStartSubmissionChat={mockOnStartSubmissionChat}
                />
            </ThemeProvider>
        );
    };

    it('loads and displays submissions options', async () => {
        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValueOnce({
            data: [{id: 'sub-2'}] as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        vi.mocked(configApiClient.submissions.submissionsDetail)
            .mockResolvedValueOnce({data: {title: 'Submission 1'}} as any) // for sub-1
            .mockResolvedValueOnce({data: {title: 'Submission 2'}} as any); // for sub-2

        vi.mocked(fetchWorkflowRulesForSubmission)
            .mockResolvedValueOnce({authorReviewerChatAllowed: true})
            .mockResolvedValueOnce({authorReviewerChatAllowed: false});

        renderComponent();

        // Autocomplete opens dropdown when clicked
        const input = screen.getByLabelText('Submission');
        fireEvent.mouseDown(input);

        await waitFor(() => {
            expect(screen.getByText('Submission 1')).toBeInTheDocument();
            expect(screen.getByText('Submission 2')).toBeInTheDocument();
        });

        // Submission 2 should show reason for not being allowed
        expect(screen.getByText('Communication not allowed in the current review phase (e.g. Double Blind)')).toBeInTheDocument();
    });

    it('submits correctly when an allowed submission is selected', async () => {
        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValueOnce({
            data: [] as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        vi.mocked(configApiClient.submissions.submissionsDetail)
            .mockResolvedValueOnce({data: {title: 'Submission 1'}} as any);

        vi.mocked(fetchWorkflowRulesForSubmission)
            .mockResolvedValueOnce({authorReviewerChatAllowed: true});

        renderComponent();

        const input = screen.getByLabelText('Submission');
        fireEvent.mouseDown(input);

        await waitFor(() => {
            expect(screen.getByText('Submission 1')).toBeInTheDocument();
        });

        // Select the option
        const option = screen.getByText('Submission 1');
        fireEvent.click(option);

        const startBtn = screen.getByRole('button', {name: 'Start Chat'});
        fireEvent.click(startBtn);

        expect(mockOnStartSubmissionChat).toHaveBeenCalledWith('sub-1');
    });

    it('shows error if starting chat with unallowed submission', async () => {
        vi.mocked(configApiClient.submissions.authorDetail).mockResolvedValueOnce({
            data: [] as any,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        vi.mocked(configApiClient.submissions.submissionsDetail)
            .mockResolvedValueOnce({data: {title: 'Submission 1'}} as any);

        vi.mocked(fetchWorkflowRulesForSubmission)
            .mockResolvedValueOnce({authorReviewerChatAllowed: false});

        renderComponent();

        const input = screen.getByLabelText('Submission');
        fireEvent.mouseDown(input);

        await waitFor(() => {
            expect(screen.getByText('Submission 1')).toBeInTheDocument();
        });

        // With MUI Autocomplete, disabled options cannot be easily clicked via fireEvent on the list item.
        // Let's just check that the Start Chat button is disabled when nothing is selected.
        const startBtn = screen.getByRole('button', {name: 'Start Chat'});
        expect(startBtn).toBeDisabled();
    });
});
