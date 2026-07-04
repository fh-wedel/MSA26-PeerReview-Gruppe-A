import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {ChatModal} from './ChatModal';
import '@testing-library/jest-dom';
import type {ChatThread} from '../stubs/chats';

describe('ChatModal component', () => {
    const theme = createTheme();
    const mockOnClose = vi.fn();
    const mockOnSendMessage = vi.fn();

    const mockThread: ChatThread = {
        id: 'thread-1',
        participants: [
            {id: 'user1', username: 'User One', email: 'user1@test.com'},
            {id: 'user2', username: 'User Two', email: 'user2@test.com'}
        ],
        messages: [
            {
                id: 'msg-1',
                senderId: 'user1',
                text: 'Hello from user 1',
                timestamp: new Date('2023-01-01T10:00:00Z').getTime(),
                readBy: ['user1', 'user2']
            },
            {
                id: 'msg-2',
                senderId: 'user2',
                text: 'Reply from user 2',
                timestamp: new Date('2023-01-01T10:01:00Z').getTime(),
                readBy: ['user2']
            }
        ],
        lastUpdated: new Date('2023-01-01T10:01:00Z').getTime()
    };

    const renderComponent = (thread: ChatThread | undefined | null) => {
        return render(
            <ThemeProvider theme={theme}>
                <ChatModal
                    open={true}
                    onClose={mockOnClose}
                    thread={thread}
                    currentUserId="user1"
                    onSendMessage={mockOnSendMessage}
                />
            </ThemeProvider>
        );
    };

    it('renders correctly with messages', () => {
        renderComponent(mockThread);

        // Check title (other participant's username)
        expect(screen.getByText('User Two')).toBeInTheDocument();

        // Check messages
        expect(screen.getByText('Hello from user 1')).toBeInTheDocument();
        expect(screen.getByText('Reply from user 2')).toBeInTheDocument();
    });

    it('shows placeholder when no thread or messages exist', async () => {
        renderComponent(undefined);

        await waitFor(() => {
            expect(screen.getAllByText('Chat').length).toBeGreaterThan(0);
            expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
        });
    });

    it('sends a message on button click', () => {
        renderComponent(mockThread);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, {target: {value: 'New message test'}});

        // Let's use getByTestId or container query if needed, but it's easier to find all buttons and click the last one, or by placeholder and pressing Enter.

        // Instead of button, let's trigger Enter key
        fireEvent.keyDown(input, {key: 'Enter', code: 'Enter', shiftKey: false});

        expect(mockOnSendMessage).toHaveBeenCalledWith('New message test', {
            bold: false,
            italic: false,
            underline: false
        });
    });

    it('applies formatting options', () => {
        renderComponent(mockThread);

        // Format buttons are identified by their icons (FormatBold, etc)
        // In MUI, they usually have test IDs or we can find the buttons by their children
        const formatButtons = screen.getAllByRole('button');
        // close button is 1st, then bold, italic, underline, then send
        const boldBtn = formatButtons[1];
        const italicBtn = formatButtons[2];

        fireEvent.click(boldBtn);
        fireEvent.click(italicBtn);

        const input = screen.getByPlaceholderText('Type a message...');
        fireEvent.change(input, {target: {value: 'Formatted text'}});
        fireEvent.keyDown(input, {key: 'Enter', code: 'Enter', shiftKey: false});

        expect(mockOnSendMessage).toHaveBeenCalledWith('Formatted text', {bold: true, italic: true, underline: false});
    });

    it('calls onClose when close icon is clicked', () => {
        renderComponent(mockThread);

        const closeBtn = screen.getByLabelText('close');
        fireEvent.click(closeBtn);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
