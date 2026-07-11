import {describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {App} from './App';

// Mock contexts to avoid actual fetches
vi.mock('./contexts/AuthContext', () => ({
    AuthProvider: ({children}: { children: React.ReactNode }) => <>{children}</>,
    useAuth: vi.fn(() => ({isAuthenticated: false, user: null}))
}));

vi.mock('./contexts/ThemeContext', () => ({
    CustomThemeProvider: ({children}: { children: React.ReactNode }) => <>{children}</>,
    useThemeContext: vi.fn(() => ({themeMode: 'light', setThemeMode: vi.fn()}))
}));

vi.mock('./contexts/NotificationContext', () => ({
    NotificationProvider: ({children}: { children: React.ReactNode }) => <>{children}</>,
    useNotification: vi.fn(() => ({notifications: [], unreadCount: 0}))
}));

vi.mock('./contexts/ChatContext', () => ({
    ChatProvider: ({children}: { children: React.ReactNode }) => <>{children}</>,
    useChat: vi.fn(() => ({chats: [], unreadCount: 0}))
}));

// We only need to check if it mounts without errors
describe('App Component', () => {
    it('renders without crashing', () => {
        const {container} = render(<App/>);
        expect(container).toBeInTheDocument();
    });
});
