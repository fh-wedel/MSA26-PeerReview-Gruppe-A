import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {UserSearchDialog} from './UserSearchDialog';
import {searchUsers} from '../../api/communication';
import {useNotification} from '../../contexts/NotificationContext';
import '@testing-library/jest-dom';

vi.mock('../../api/communication', () => ({
    searchUsers: vi.fn(),
}));

vi.mock('../../contexts/NotificationContext', () => ({
    useNotification: vi.fn(),
}));

describe('UserSearchDialog component', () => {
    const theme = createTheme();
    const mockOnClose = vi.fn();
    const mockOnSelectUser = vi.fn();
    const mockShowError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useNotification).mockReturnValue({
            notifications: [],
            unreadCount: 0,
            showSuccess: vi.fn(),
            showError: mockShowError,
            showInfo: vi.fn(),
            markAsRead: vi.fn(),
            markAllAsRead: vi.fn(),
            loadNotifications: vi.fn(),
        });
    });

    const renderComponent = (excludeUserId?: string, existingGeneralChats = []) => {
        return render(
            <ThemeProvider theme={theme}>
                <UserSearchDialog
                    open={true}
                    onClose={mockOnClose}
                    onSelectUser={mockOnSelectUser}
                    excludeUserId={excludeUserId}
                    existingGeneralChats={existingGeneralChats}
                />
            </ThemeProvider>
        );
    };

    it('loads and displays users, excluding current user', async () => {
        vi.mocked(searchUsers).mockResolvedValueOnce([
            {id: 'u1', username: 'alice', email: 'alice@test.com'},
            {id: 'u2', username: 'bob', email: 'bob@test.com'},
            {id: 'current', username: 'myself', email: 'me@test.com'}
        ]);

        renderComponent('current');

        // Shows loading initially
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
            expect(screen.getByText('bob')).toBeInTheDocument();
        });

        // Should not show the excluded user
        expect(screen.queryByText('myself')).not.toBeInTheDocument();
    });

    it('filters users based on search query', async () => {
        vi.mocked(searchUsers).mockResolvedValueOnce([
            {id: 'u1', username: 'alice', email: 'alice@test.com'},
            {id: 'u2', username: 'bob', email: 'bob@test.com'}
        ]);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });

        const searchInput = screen.getByLabelText(/Search by name or email/i);
        fireEvent.change(searchInput, {target: {value: 'bob'}});

        expect(screen.queryByText('alice')).not.toBeInTheDocument();
        expect(screen.getByText('bob')).toBeInTheDocument();
    });

    it('shows error notification when search fails', async () => {
        vi.mocked(searchUsers).mockRejectedValueOnce(new Error('Network error'));

        renderComponent();

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Network error', 'Communication Service');
        });
    });

    it('selects user when clicked', async () => {
        vi.mocked(searchUsers).mockResolvedValueOnce([
            {id: 'u1', username: 'alice', email: 'alice@test.com'}
        ]);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });

        const userItem = screen.getByText('alice').closest('div');
        fireEvent.click(userItem!);

        expect(mockOnSelectUser).toHaveBeenCalledWith({id: 'u1', username: 'alice', email: 'alice@test.com'});
    });

    it('shows chip for existing chats', async () => {
        vi.mocked(searchUsers).mockResolvedValueOnce([
            {id: 'u1', username: 'alice', email: 'alice@test.com'}
        ]);

        renderComponent(undefined, [{
            id: 'chat1',
            type: 'GENERAL',
            otherParticipantId: 'u1',
            otherParticipantName: 'alice',
            unreadCount: 0,
            lastMessageAt: new Date().toISOString()
        }]);

        await waitFor(() => {
            expect(screen.getByText('Chat exists')).toBeInTheDocument();
        });
    });
});
