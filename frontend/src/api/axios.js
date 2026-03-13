import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

// Agrega el token JWT automáticamente a cada request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Si el token expiró (401/403), cierra sesión y manda al login
// EXCEPTO en la ruta de login — ahí el 401 es normal (credenciales incorrectas)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const esRutaLogin = error.config?.url?.includes('/auth/login');
        if (!esRutaLogin && (error.response?.status === 401 || error.response?.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
