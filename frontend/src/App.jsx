import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Acuerdos        from './pages/Acuerdos';
import FormAcuerdo     from './pages/FormAcuerdo';
import Actas           from './pages/Actas';
import Historial       from './pages/Historial';
import HistorialGlobal from './pages/HistorialGlobal';
import Usuarios        from './pages/Usuarios';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard"                       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/acuerdos"                        element={<ProtectedRoute><Acuerdos /></ProtectedRoute>} />
                    <Route path="/acuerdos/nuevo"                  element={<ProtectedRoute><FormAcuerdo /></ProtectedRoute>} />
                    <Route path="/acuerdos/:id/editar"             element={<ProtectedRoute><FormAcuerdo /></ProtectedRoute>} />
                    <Route path="/acuerdos/:id/historial"          element={<ProtectedRoute><Historial /></ProtectedRoute>} />
                    <Route path="/actas"                           element={<ProtectedRoute><Actas /></ProtectedRoute>} />
                    <Route path="/historial"                       element={<ProtectedRoute><HistorialGlobal /></ProtectedRoute>} />
                    <Route path="/usuarios"                        element={<AdminRoute><Usuarios /></AdminRoute>} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
