import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {ChatWidget} from './ChatWidget';
import {fetchChatDetail, sendMessage} from '../../api/communication';
import {useChat} from '../../contexts/ChatContext';
import {useAuth} from '../../contexts/AuthContext';
import {useNotification} from '../../contexts/NotificationContext';
import {usersApiClient} from '../../api/clients';
import '@testing-library/jest-dom';

vi.mock('../../api/communication', () => ({
    fetchChatDetail: vi.fn(),
    sendMessage: vi.fn(),
}));

vi.mock('../../api/clients', () => ({
    usersApiClient: {
        bulk: {
            bulkResolveUsers: vi.fn(),
        }
    }
}));

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../contexts/ChatContext', () => ({
    useChat: vi.fn(),
}));

vi.mock('../../contexts/NotificationContext', () => ({
    useNotification: vi.fn(),
}));

describe('ChatWidget component', () => {
    const theme = createTheme();
    const mockMarkChatAsRead = vi.fn();
    const mockRefreshChats = vi.fn();
    const mockShowError = vi.fn();

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
            messagesStream: null,
            markChatAsRead: mockMarkChatAsRead,
            refreshChats: mockRefreshChats,
            disconnectSSE: vi.fn(),
        } as any);

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

        // Default mock implementation to avoid unhandled rejections
        vi.mocked(usersApiClient.bulk.bulkResolveUsers).mockResolvedValue({
            data: {users: {}},
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });
    });

    const renderComponent = (props = {}) => {
        return render(
            <ThemeProvider theme={theme}>
                <ChatWidget {...props} />
            </ThemeProvider>
        );
    };

    it('renders correctly without chatId', () => {
        renderComponent();
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('loads and displays messages when chatId is provided', async () => {
        vi.mocked(fetchChatDetail).mockResolvedValueOnce({
            chatId: 'chat-1',
            messages: [
                {messageId: 'm1', senderId: 'user1', body: 'Hello', sentAt: new Date().toISOString()},
                {messageId: 'm2', senderId: 'user2', body: 'Hi there', sentAt: new Date().toISOString()}
            ]
        } as any);

        vi.mocked(usersApiClient.bulk.bulkResolveUsers).mockResolvedValueOnce({
            data: {users: {'user2': 'User Two'}},
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        renderComponent({chatId: 'chat-1'});

        // Loading state initially
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Hello')).toBeInTheDocument();
            expect(screen.getByText('Hi there')).toBeInTheDocument();
        });

        // Check if username resolution worked
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(mockMarkChatAsRead).toHaveBeenCalledWith('chat-1');
    });

    it('sends a message', async () => {
        vi.mocked(fetchChatDetail).mockResolvedValueOnce({
            chatId: 'chat-1',
            messages: []
        } as any);

        vi.mocked(sendMessage).mockResolvedValueOnce({
            chatId: 'chat-1',
            messages: [
                {messageId: 'm3', senderId: 'user1', body: 'New msg', sentAt: new Date().toISOString()}
            ]
        } as any);

        renderComponent({chatId: 'chat-1'});

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, {target: {value: 'New msg'}});

        // Press Enter
        fireEvent.keyDown(input, {key: 'Enter', code: 'Enter'});

        await waitFor(() => {
            expect(sendMessage).toHaveBeenCalledWith({
                recipientId: undefined,
                body: 'New msg',
                chatContext: {
                    type: 'GENERAL',
                    submissionId: undefined
                }
            });
            // Should show the new message
            expect(screen.getByText('New msg')).toBeInTheDocument();
            expect(mockRefreshChats).toHaveBeenCalled();
            expect(mockMarkChatAsRead).toHaveBeenCalledWith('chat-1');
        });
    });

    it('shows error notification when fetch fails', async () => {
        vi.mocked(fetchChatDetail).mockRejectedValueOnce(new Error('Failed to fetch'));

        renderComponent({chatId: 'chat-1'});

        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith('Failed to fetch', 'Communication Service');
        });
    });

    it('handles SSE updates properly', async () => {
        vi.mocked(fetchChatDetail).mockResolvedValueOnce({
            chatId: 'chat-1',
            messages: []
        } as any);

        // Mock ChatContext to return a messagesStream event
        vi.mocked(useChat).mockReturnValue({
            chats: [],
            unreadCount: 0,
            messagesStream: {
                chatId: 'chat-1',
                message: {messageId: 'm4', senderId: 'user3', body: 'SSE msg', sentAt: new Date().toISOString()}
            },
            markChatAsRead: mockMarkChatAsRead,
            refreshChats: mockRefreshChats,
            disconnectSSE: vi.fn(),
        } as any);

        renderComponent({chatId: 'chat-1'});

        await waitFor(() => {
            expect(screen.getByText('SSE msg')).toBeInTheDocument();
        });
    });
});
