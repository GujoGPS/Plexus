import { User } from '../../types';

declare const google: any;
declare global {
  interface Window {
    google: typeof google;
  }
}

// Adicionados Scopes de identidade para permitir a leitura do nome e foto do utilizador
const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.appdata',
].join(' ');

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export class AuthService {
  private accessToken: string | null = null;
  private user: User | null = null;
  private tokenClient: any = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    this.loadStoredToken();
  }

  private loadStoredToken(): void {
    const stored = localStorage.getItem('google_token');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.accessToken = data.access_token;
        this.user = data.user;
      } catch {
        localStorage.removeItem('google_token');
      }
    }
  }

  private saveToken(): void {
    if (this.accessToken && this.user) {
      localStorage.setItem('google_token', JSON.stringify({
        access_token: this.accessToken,
        user: this.user,
      }));
    }
  }

  isSignedIn(): boolean {
    return !!this.accessToken;
  }

  getUser(): User | null {
    return this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.user));
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID) {
        reject(new Error('Google Client ID not configured'));
        return;
      }

      if (!window.google?.accounts?.oauth2) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.initTokenClient();
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.body.appendChild(script);
      } else {
        this.initTokenClient();
        resolve();
      }
    });
  }

  private initTokenClient(): void {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          this.accessToken = response.access_token;
          this.fetchUserInfo();
        }
      },
    });
  }

  private async fetchUserInfo(): Promise<void> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.user = {
          email: data.email,
          name: data.name,
          picture: data.picture,
        };
        this.saveToken();
        this.notifyListeners();
      } else {
        const errorData = await response.json();
        console.error('Erro na API UserInfo:', errorData);
      }
    } catch (error) {
      console.error('Falha ao buscar dados do utilizador:', error);
    }
  }

  login(): void {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  silentLogin(): void {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  logout(): void {
    const oldToken = this.accessToken;
    this.accessToken = null;
    this.user = null;
    localStorage.removeItem('google_token');

    if (window.google?.accounts?.oauth2 && oldToken) {
      window.google.accounts.oauth2.revoke(oldToken, () => {});
    }

    this.notifyListeners();
  }

  async refreshToken(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.tokenClient) {
        this.tokenClient.callback = (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            this.saveToken();
            resolve(true);
          } else {
            resolve(false);
          }
        };
        this.tokenClient.requestAccessToken({ prompt: '' });
      } else {
        resolve(false);
      }
    });
  }
}

export const authService = new AuthService();