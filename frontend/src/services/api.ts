export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('stadiumiq_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type header only if sending json and not form-data
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';
  const resolvedUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(resolvedUrl, {
    ...options,
    headers
  });

  // Handle unauthorized/expired sessions
  if (response.status === 401) {
    localStorage.removeItem('stadiumiq_token');
    localStorage.removeItem('stadiumiq_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error: ${response.status}`);
  }

  return response.json();
};
