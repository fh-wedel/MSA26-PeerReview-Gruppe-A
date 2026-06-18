const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || '';
const REDIRECT_URI = window.location.origin + import.meta.env.BASE_URL;

async function refreshTokens(): Promise<boolean> {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (!refreshToken) {
        return false;
    }

    try {
        const tokenUrl = `https://${COGNITO_DOMAIN}/oauth2/token`;
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (!response.ok) {
            return false;
        }

        const tokens = await response.json();

        // Update tokens in sessionStorage
        if (tokens.id_token) sessionStorage.setItem('id_token', tokens.id_token);
        if (tokens.access_token) sessionStorage.setItem('access_token', tokens.access_token);
        // Sometimes Cognito returns a new refresh_token, sometimes it doesn't
        if (tokens.refresh_token) sessionStorage.setItem('refresh_token', tokens.refresh_token);

        return true;
    } catch (err) {
        console.error('Error refreshing token:', err);
        return false;
    }
}

export const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // First attempt
    let response = await fetch(input, init);

    // If we get a 403 (or 401), try to refresh the token
    if (response.status === 403 || response.status === 401) {
        const success = await refreshTokens();
        if (success) {
            // Retry the original request with the new access token
            const newAccessToken = sessionStorage.getItem('access_token');
            const headers = new Headers(init?.headers);
            if (newAccessToken) {
                headers.set('Authorization', `Bearer ${newAccessToken}`);
            }

            response = await fetch(input, {...init, headers});
        } else {
            // Sign out
            sessionStorage.removeItem('id_token');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = REDIRECT_URI;
        }
    }

    return response;
};
