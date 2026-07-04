import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {ReviewFormModal} from './ReviewFormModal';
import {configurationApiClient, responseApiClient} from '../api/clients';
import '@testing-library/jest-dom';

vi.mock('../api/clients', () => ({
    configurationApiClient: {
        submissions: {
            getFeedbackFormForSubmission: vi.fn(),
        },
    },
    responseApiClient: {
        results: {
            resultsCreate: vi.fn(),
        },
    },
}));

describe('ReviewFormModal component', () => {
    const theme = createTheme();
    const mockOnClose = vi.fn();
    const mockOnSubmitted = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ThemeProvider theme={theme}>
                <ReviewFormModal
                    open={true}
                    onClose={mockOnClose}
                    submissionId="sub-123"
                    onSubmitted={mockOnSubmitted}
                />
            </ThemeProvider>
        );
    };

    it('loads and displays questions', async () => {
        vi.mocked(configurationApiClient.submissions.getFeedbackFormForSubmission).mockResolvedValueOnce({
            data: [
                {id: 'q1', text: 'Question 1', type: 'TEXT', required: true},
                {id: 'q2', text: 'Question 2', type: 'RATING', required: false, maxPoints: 5}
            ],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        renderComponent();

        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Question 1/)).toBeInTheDocument();
            expect(screen.getByText(/Question 2/)).toBeInTheDocument();
        });
    });

    it('shows error if submission fails required validation', async () => {
        vi.mocked(configurationApiClient.submissions.getFeedbackFormForSubmission).mockResolvedValueOnce({
            data: [
                {id: 'q1', text: 'Question 1', type: 'TEXT', required: true}
            ],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Question 1/)).toBeInTheDocument();
        });

        const submitBtn = screen.getByRole('button', {name: 'Submit Review'});
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Please answer the required question: Question 1')).toBeInTheDocument();
        });
    });

    it('shows error if overall comments are missing', async () => {
        vi.mocked(configurationApiClient.submissions.getFeedbackFormForSubmission).mockResolvedValueOnce({
            data: [],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Overall Comments/)).toBeInTheDocument();
        });

        const submitBtn = screen.getByRole('button', {name: 'Submit Review'});
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Please provide overall comments.')).toBeInTheDocument();
        });
    });

    it('submits successfully when form is valid', async () => {
        vi.mocked(configurationApiClient.submissions.getFeedbackFormForSubmission).mockResolvedValueOnce({
            data: [
                {id: 'q1', text: 'Question 1', type: 'TEXT', required: true}
            ],
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        vi.mocked(responseApiClient.results.resultsCreate).mockResolvedValueOnce({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Question 1/)).toBeInTheDocument();
        });

        // Fill the text question
        const q1Input = screen.getByPlaceholderText('Enter your feedback...');
        fireEvent.change(q1Input, {target: {value: 'Great job'}});

        // Fill overall comments
        const commentsInput = screen.getByPlaceholderText('Summary of the review...');
        fireEvent.change(commentsInput, {target: {value: 'Overall good'}});

        // Submit
        const submitBtn = screen.getByRole('button', {name: 'Submit Review'});
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(responseApiClient.results.resultsCreate).toHaveBeenCalledWith({
                submissionId: 'sub-123',
                reviewComments: 'Overall good',
                finalGrade: '',
                answers: [
                    {questionId: 'q1', answer: 'Great job'}
                ]
            });
            expect(mockOnSubmitted).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
});
