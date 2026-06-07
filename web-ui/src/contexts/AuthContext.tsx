import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

export interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => { },
  signup: async () => { },
  logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || '';
const REDIRECT_URI = window.location.origin + import.meta.env.BASE_URL;

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

function parseTokenToUser(token: string): User | null {
  const decoded = decodeJwt(token);
  if (!decoded) return null;

  const groups = decoded['cognito:groups'] || [];
  const roles = groups.length > 0 ? groups : ['Guest'];

  return {
    id: decoded.sub || '',
    email: decoded.email || '',
    username: decoded['cognito:username'] || decoded.email || 'User',
    roles: roles,
  };
}

async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<any> {
  const tokenUrl = `https://${COGNITO_DOMAIN}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code: code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check if token already exists in sessionStorage
      const storedIdToken = sessionStorage.getItem('id_token');
      if (storedIdToken) {
        const parsedUser = parseTokenToUser(storedIdToken);
        if (parsedUser) {
          setUser(parsedUser);
          setLoading(false);
          return;
        }
      }

      // 2. Check if we have an authorization code from Cognito in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        const codeVerifier = sessionStorage.getItem('code_verifier');
        if (codeVerifier) {
          try {
            const tokens = await exchangeCodeForTokens(code, codeVerifier);

            // Store tokens in sessionStorage
            sessionStorage.setItem('id_token', tokens.id_token);
            sessionStorage.setItem('access_token', tokens.access_token);
            if (tokens.refresh_token) {
              sessionStorage.setItem('refresh_token', tokens.refresh_token);
            }

            // Remove code_verifier as it's one-time use
            sessionStorage.removeItem('code_verifier');

            // Clean query parameters from URL
            window.history.replaceState({}, document.title, window.location.pathname);

            const parsedUser = parseTokenToUser(tokens.id_token);
            setUser(parsedUser);
          } catch (err) {
            console.error('Error during token exchange:', err);
          }
        } else {
          console.error('Auth code found in URL but no code_verifier in sessionStorage');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    if (!CLIENT_ID || !COGNITO_DOMAIN) {
      console.error('Cognito client configuration is missing');
      return;
    }

    const verifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', verifier);

    const challenge = await generateCodeChallenge(verifier);
    const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=openid+email&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = loginUrl;
  };

  const signup = async () => {
    if (!CLIENT_ID || !COGNITO_DOMAIN) {
      console.error('Cognito client configuration is missing');
      return;
    }

    const verifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', verifier);

    const challenge = await generateCodeChallenge(verifier);
    const signupUrl = `https://${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=openid+email&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${challenge}&code_challenge_method=S256`;

    window.location.href = signupUrl;
  };

  const logout = () => {
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    window.location.href = REDIRECT_URI;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
