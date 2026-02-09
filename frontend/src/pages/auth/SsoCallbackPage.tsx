import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function SsoCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setError('Missing SSO code');
      return;
    }

    fetch(`${API_URL}/auth/sso-exchange?code=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Exchange failed');
        return res.json();
      })
      .then(({ data }) => {
        // Store tokens in Zustand persist format
        const authData = {
          state: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            currentOrgId: data.currentOrgId,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('auth-storage', JSON.stringify(authData));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        // Navigate to dashboard
        window.location.replace('/dashboard');
      })
      .catch(() => {
        setError('SSO login failed. Please try again from the platform.');
      });
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/login" className="text-primary underline">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
