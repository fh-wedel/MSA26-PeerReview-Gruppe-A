import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {SubmissionModal} from './SubmissionModal';
import {useAuth} from '../contexts/AuthContext';
import {useGroupMembers} from '../hooks/useGroupMembers';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {useTopicTags} from '../hooks/useTopicTags';
import '@testing-library/jest-dom';

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../hooks/useGroupMembers', () => ({
    useGroupMembers: vi.fn(),
}));

vi.mock('../hooks/useWorkflowPlugins', () => ({
    useWorkflowPlugins: vi.fn(),
}));

vi.mock('../hooks/useTopicTags', () => ({
    useTopicTags: vi.fn(),
}));

describe('SubmissionModal component', () => {
    const theme = createTheme();
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            user: {id: 'user1', email: 'author@test.com', username: 'author', roles: ['Author']},
            logout: vi.fn(),
            loading: false,
            login: vi.fn(),
            signup: vi.fn(),
        });

        vi.mocked(useGroupMembers).mockReturnValue({
            members: [
                {id: 'user1', username: 'author1', email: 'author1@test.com'},
                {id: 'user2', username: 'author2', email: 'author2@test.com'}
            ],
            loading: false,
            error: null,
        });

        vi.mocked(useWorkflowPlugins).mockReturnValue({
            types: [
                {name: 'SINGLE_BLIND', title: 'Single Blind', description: 'desc'}
            ],
            templates: [
                {
                    name: 'INDIVIDUAL_WORK',
                    title: 'Individual Work',
                    minAuthors: 1,
                    maxAuthors: 1,
                    minReviewers: 1,
                    maxReviewers: 1,
                    submissionDurationDays: 14,
                    reviewDurationDays: 14,
                    allowAuthorCustomReviewer: false,
                    description: 'desc'
                }
            ],
            loading: false,
            error: null,
        });

        vi.mocked(useTopicTags).mockReturnValue({
            topicTags: [
                {tagName: 'Software Engineering', id: '1'},
                {tagName: 'AI', id: '2'}
            ],
            loading: false,
            error: null,
        });
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <ThemeProvider theme={theme}>
                    <SubmissionModal
                        open={true}
                        onClose={mockOnClose}
                        onSubmit={mockOnSubmit}
                        authorName="testuser"
                        currentUserId="user1"
                    />
                </ThemeProvider>
            </MemoryRouter>
        );
    };

    it('renders correctly and displays initial fields', async () => {
        renderComponent();

        expect(screen.getByText('Create Submission')).toBeInTheDocument();

        // Check if the input labels are rendered
        expect(screen.getByLabelText(/Paper Title \*/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Number of Reviewers/)).toBeInTheDocument();

        // Check if Create button is present
        expect(screen.getByRole('button', {name: 'Create'})).toBeInTheDocument();
    });

    it('shows validation errors when mandatory fields are empty and submit is clicked', async () => {
        renderComponent();

        const createBtn = screen.getByRole('button', {name: 'Create'});
        fireEvent.click(createBtn);

        await waitFor(() => {
            // It should show mandatory field errors
            expect(screen.getByText('Title is mandatory')).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form with correct values', async () => {
        mockOnSubmit.mockResolvedValueOnce();
        renderComponent();

        // Fill Paper Title
        fireEvent.change(screen.getByLabelText(/Paper Title \*/), {target: {value: 'My Paper Title'}});

        // Select Topic Tag
        // We need to wait for the combobox to render and interact with it
        const topicTagLabel = screen.getByLabelText(/Topic Tag \*/);
        fireEvent.mouseDown(topicTagLabel);
        const aiOption = await screen.findByText('AI');
        fireEvent.click(aiOption);

        const createBtn = screen.getByRole('button', {name: 'Create'});
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                'My Paper Title',
                'SINGLE_BLIND',
                ['user1'],
                'INDIVIDUAL_WORK',
                1,
                expect.any(Date),
                expect.any(Date),
                'AI',
                []
            );
        });
    });

    it('calls onClose when Cancel is clicked', () => {
        renderComponent();

        const cancelBtn = screen.getByRole('button', {name: 'Cancel'});
        fireEvent.click(cancelBtn);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
