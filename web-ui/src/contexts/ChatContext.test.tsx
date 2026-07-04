import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {ChatProvider, useChat} from './ChatContext';
import {fetchChats} from '../api/communication';
import {useAuth} from './AuthContext';
import {useNotification} from './NotificationContext';

vi.mock('../api/communication', () => ({
    fetchChats: vi.fn(),
}));

vi.mock('./AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('./NotificationContext', () => ({
    useNotification: vi.fn(),
}));

// Mock fetchEventSource to do nothing for these tests since we skip SSE testing
vi.mock('@microsoft/fetch-event-source', () => ({
    fetchEventSource: vi.fn(() => Promise.resolve()),
}));

describe('ChatContext', () => {
    const mockShowError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        vi.mocked(useNotification).mockReturnValue({
            showError: mockShowError,
            showSuccess: vi.fn(),
            showWarning: vi.fn(),
        });
    });

    const wrapper = ({children}: { children: React.ReactNode }) => (
        <ChatProvider>{children}</ChatProvider>
    );

    it('does not fetch chats if unauthenticated', async () => {
        vi.mocked(useAuth).mockReturnValue({isAuthenticated: false, user: null, loading: false} as any);

        renderHook(() => useChat(), {wrapper});

        expect(fetchChats).not.toHaveBeenCalled();
    });

    it('fetches chats and sorts them by lastMessageAt on mount if authenticated', async () => {
        vi.mocked(useAuth).mockReturnValue({isAuthenticated: true, user: {id: 'user1'}, loading: false} as any);

        const mockChats = [
            {chatId: 'c1', lastMessageAt: '2024-01-01T10:00:00Z', chatType: 'GENERAL'},
            {chatId: 'c2', lastMessageAt: '2024-01-02T10:00:00Z', chatType: 'GENERAL'},
        ];

        vi.mocked(fetchChats).mockResolvedValueOnce({chats: mockChats} as any);

        const {result} = renderHook(() => useChat(), {wrapper});

        // Wait for async fetch
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(fetchChats).toHaveBeenCalled();
        // Should be sorted descending
        expect(result.current.chats[0].chatId).toBe('c2');
        expect(result.current.chats[1].chatId).toBe('c1');
    });

    it('calculates unreadCount based on chats and localStorage', async () => {
        vi.mocked(useAuth).mockReturnValue({isAuthenticated: true, user: {id: 'user1'}, loading: false} as any);

        const mockChats = [
            {chatId: 'c1', lastMessageAt: '2024-01-02T10:00:00Z', chatType: 'GENERAL'},
            {chatId: 'c2', lastMessageAt: '2024-01-01T10:00:00Z', chatType: 'GENERAL'},
        ];
        vi.mocked(fetchChats).mockResolvedValueOnce({chats: mockChats} as any);

        // c2 was read *after* its last message
        // c1 has no read timestamp so it's unread
        localStorage.setItem('chat_read_timestamps', JSON.stringify({
            'c2': '2024-01-02T00:00:00Z'
        }));

        const {result} = renderHook(() => useChat(), {wrapper});

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(result.current.unreadCount).toBe(1); // Only c1 is unread
    });

    it('markChatAsRead updates unreadCount and localStorage', async () => {
        vi.mocked(useAuth).mockReturnValue({isAuthenticated: true, user: {id: 'user1'}, loading: false} as any);

        const mockChats = [
            {chatId: 'c1', lastMessageAt: '2024-01-01T10:00:00Z', chatType: 'GENERAL'}
        ];
        vi.mocked(fetchChats).mockResolvedValueOnce({chats: mockChats} as any);

        const {result} = renderHook(() => useChat(), {wrapper});

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        expect(result.current.unreadCount).toBe(1);

        act(() => {
            result.current.markChatAsRead('c1');
        });

        expect(result.current.unreadCount).toBe(0);
        const stored = JSON.parse(localStorage.getItem('chat_read_timestamps') || '{}');
        expect(stored.c1).toBeDefined();
    });
});
