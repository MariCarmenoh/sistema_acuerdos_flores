import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege rutas que requieren estar logueado
export const ProtectedRoute = ({ children }) => {
    const { usuario, cargando } = useAuth();
    if (cargando) return null;
    if (!usuario) return <Navigate to="/login" replace />;
    return children;
};

// Protege rutas que solo puede ver el Administrador
export const AdminRoute = ({ children }) => {
    const { usuario, cargando } = useAuth();
    if (cargando) return null;
    if (!usuario) return <Navigate to="/login" replace />;
    if (usuario.rol !== 'Administrador') return <Navigate to="/dashboard" replace />;
    return children;
};
