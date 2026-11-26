import axios from 'axios';

const isLocalBrowser =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isLocalBrowser ? 'http://127.0.0.1:8000/api/v1' : '/api/v1');

export const API_ORIGIN = API_BASE_URL.startsWith('http')
  ? API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  : typeof window !== 'undefined'
  ? window.location.origin
  : '';

export function resolveAvatarUrl(user) {
  if (!user) return null;
  if (user.avatar_url && /^https?:\/\//i.test(user.avatar_url)) {
    return user.avatar_url;
  }
  if (user.avatar_path) {
    if (/^https?:\/\//i.test(user.avatar_path)) {
      return user.avatar_path;
    }
    return `${API_ORIGIN}/${String(user.avatar_path).replace(/^\/+/, '')}`;
  }
  return user.avatar_url || null;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('psas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('psas_token');
      localStorage.removeItem('psas_user');
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth-logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (nis_nip, password) => apiClient.post('/login', { nis_nip, password }),
  logout: () => apiClient.post('/logout'),
  me: () => apiClient.get('/user'),
  updatePhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiClient.post('/user/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePhoto: () => apiClient.delete('/user/photo'),
};

export const presensiApi = {
  scan: (qr_token, latitude, longitude) =>
    apiClient.post('/presensi/scan', { qr_token, latitude, longitude }),
  today: () => apiClient.get('/presensi/today'),
};

export const jadwalApi = {
  get: (kelas) => apiClient.get('/jadwal', { params: { kelas } }),
};

export const dashboardApi = {
  siswa: () => apiClient.get('/dashboard'),
  guruMonitoring: (kelas, tanggal) =>
    apiClient.get('/guru/monitoring', { params: { kelas, tanggal } }),
};

export const adminApi = {
  getQr: () => apiClient.get('/admin/qr'),
  regenerateQr: () => apiClient.post('/admin/qr'),
};

export default apiClient;
