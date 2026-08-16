import axios from 'axios';

export interface PingLog {
  id: number;
  status_code: number | null;
  response_time_ms: number | null;
  is_up: boolean;
  timestamp: string;
}

export interface Monitor {
  id: number;
  name: string;
  url: string;
  is_active: boolean;
  owner_id: number;
  pings: PingLog[];
}

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const register = async (username: string, password: string) => {
  const response = await api.post('/register', { username, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/logout');
  return response.data;
};


export const getMonitors = async (): Promise<Monitor[]> => {
  const response = await api.get('/monitors');
  return response.data;
};

export const createMonitor = async (name: string, url: string): Promise<Monitor> => {
  const response = await api.post('/monitors', { name, url });
  return response.data;
};

export const pingMonitor = async (id: number) => {
  const response = await api.post(`/monitors/${id}/ping`);
  return response.data;
};

export default api;