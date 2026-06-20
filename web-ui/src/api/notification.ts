import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
}

const getHeaders = () => {
  const token = sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await fetch('/api/notification/me', { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const response = await fetch(`/api/notification/${id}/read`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to mark notification read');
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const response = await fetch('/api/notification/me/read-all', {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to mark all notifications read');
};

/**
 * Opens an SSE stream of new notifications. The backend completes the emitter
 * after each event (Lambda-proxy/API-Gateway 29s constraint), so fetchEventSource
 * reconnects automatically. Returns an AbortController to close the stream.
 */
export const streamNotifications = (
  onNotification: (n: Notification) => void,
): AbortController => {
  const token = sessionStorage.getItem('access_token');
  const abortController = new AbortController();

  fetchEventSource('/api/notification/me/stream', {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      Accept: 'text/event-stream',
    },
    signal: abortController.signal,
    async onmessage(ev) {
      if (ev.event === 'notification') {
        try {
          onNotification(JSON.parse(ev.data) as Notification);
        } catch (err) {
          console.error('Error parsing notification SSE', err);
        }
      }
    },
    onclose() {
      // Clean 200 close after each event → throw routes to onerror → library reconnects.
      throw new Error('SSE stream closed by server — reconnecting');
    },
    onerror() {
      // Return nothing — fetchEventSource retries on its own.
    },
  }).catch(() => {
    // Aborted or permanently failed — ignore.
  });

  return abortController;
};
