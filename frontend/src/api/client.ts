/**
 * API client — handles HTTP requests with JWT auth and token refresh.
 */

const API_BASE = '/api';

interface TokenStore {
  accessToken: string | null;
  refreshToken: string | null;
}

const tokens: TokenStore = {
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
};

export function setTokens(access: string, refresh: string) {
  tokens.accessToken = access;
  tokens.refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  tokens.accessToken = null;
  tokens.refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken(): string | null {
  return tokens.accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!tokens.refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (tokens.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  // If 401, try refreshing token
  if (res.status === 401 && tokens.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, error.detail || 'Request failed');
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Auth API ---

export interface AuthResponse {
  user: UserResponse;
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<UserResponse>('/auth/me'),
};

// --- Documents API ---

export interface DocumentResponse {
  id: string;
  user_id: string;
  title: string;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetailResponse extends DocumentResponse {
  content: string;
  version_number: number;
  versions_count: number;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
}

export interface VersionResponse {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  author_id: string;
  parent_version_id: string | null;
  commit_message: string | null;
  created_at: string;
}

export const documentsApi = {
  list: (skip = 0, limit = 50) =>
    apiFetch<DocumentListResponse>(`/documents?skip=${skip}&limit=${limit}`),

  get: (id: string) =>
    apiFetch<DocumentDetailResponse>(`/documents/${id}`),

  create: (title = 'Untitled', content = '') =>
    apiFetch<DocumentDetailResponse>('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  update: (id: string, data: { title?: string; content?: string; commit_message?: string }) =>
    apiFetch<DocumentDetailResponse>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/documents/${id}`, { method: 'DELETE' }),

  listVersions: (docId: string) =>
    apiFetch<VersionResponse[]>(`/documents/${docId}/versions`),

  getVersion: (docId: string, versionId: string) =>
    apiFetch<VersionResponse>(`/documents/${docId}/versions/${versionId}`),

  rollback: (docId: string, versionId: string) =>
    apiFetch<DocumentDetailResponse>(`/documents/${docId}/versions/${versionId}/rollback`, {
      method: 'POST',
    }),
};
