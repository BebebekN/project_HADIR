import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export function resolveAvatarUrl(user) {
  if (!user) return null;
  if (user.avatar_path) {
    return `${API_ORIGIN}/${String(user.avatar_path).replace(/^\/+/, '')}`;
  }
  return user.avatar_url || null;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach Sanctum token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('psas_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

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
  guruMonitoring: (kelas, tanggal) => apiClient.get('/guru/monitoring', { params: { kelas, tanggal } }),
};

export default apiClient;
