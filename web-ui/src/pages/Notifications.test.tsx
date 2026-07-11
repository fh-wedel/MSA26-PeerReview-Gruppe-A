import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {MemoryRouter} from 'react-router-dom';
import {Notifications} from './Notifications';
import {fetchNotifications, markAllNotificationsRead} from '../api/notification';

vi.mock('../contexts/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        isAuthenticated: true,
    })),
}));

vi.mock('../contexts/ThemeContext', () => ({
    useThemeContext: vi.fn(() => ({
        mode: 'light',
    })),
}));

vi.mock('../api/notification', () => ({
    fetchNotifications: vi.fn(() => Promise.resolve([])),
    markNotificationRead: vi.fn(() => Promise.resolve()),
    markAllNotificationsRead: vi.fn(() => Promise.resolve()),
    streamNotifications: vi.fn(() => ({abort: vi.fn()})),
}));

describe('Notifications Component', () => {
    const theme = createTheme();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderNotifications = () => {
        return render(
            <MemoryRouter>
                <ThemeProvider theme={theme}>
                    <Notifications/>
                </ThemeProvider>
            </MemoryRouter>
        );
    };

    it('renders correctly with no notifications', async () => {
        renderNotifications();

        expect(screen.getByText('Notifications')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('No notifications found')).toBeInTheDocument();
        });
    });

    it('renders notifications and handles mark as read', async () => {
        const mockNotifs = [
            {id: '1', title: 'Test Review', message: 'Message 1', read: false, date: new Date().toISOString()},
            {id: '2', title: 'Other Update', message: 'Message 2', read: true, date: new Date().toISOString()}
        ];
        vi.mocked(fetchNotifications).mockResolvedValueOnce(mockNotifs as any);

        renderNotifications();

        await waitFor(() => {
            expect(screen.getByText('Test Review')).toBeInTheDocument();
            expect(screen.getByText('Other Update')).toBeInTheDocument();
        });

        const markAllBtn = screen.getByText('Mark all read');
        fireEvent.click(markAllBtn);

        expect(markAllNotificationsRead).toHaveBeenCalled();
    });
});
