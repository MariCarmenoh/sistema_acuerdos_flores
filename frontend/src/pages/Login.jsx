import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdError } from 'react-icons/md';

const Login = () => {
    const [form, setForm] = useState({ correo: '', password: '' });
    const [verPassword, setVerPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cargando) return;
        setError('');
        setCargando(true);
        try {
            const { data } = await api.post('/auth/login', form);
            login(data.token, data.usuario);
            navigate('/dashboard');
        } catch {
            setError('Usuario o contraseña incorrectos. Verifique sus datos e intente de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Panel izquierdo */}
            <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-muni-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative z-10 text-center px-12">
                    <div className="bg-white rounded-full p-4 mx-auto mb-8 inline-block shadow-2xl">
                        <img src="/escudo.png" alt="Escudo Municipalidad de Flores" className="w-56 h-auto" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Sistema de Acuerdos</h1>
                    <p className="text-blue-200 text-lg">Municipalidad de Flores</p>
                    <div className="mt-8 w-16 h-1 bg-yellow-400 mx-auto rounded-full" />
                    <p className="text-blue-200 text-sm mt-6 max-w-xs">
                        Gestión y seguimiento de acuerdos municipales del Cantón de Flores
                    </p>
                </div>
            </div>

            {/* Panel derecho */}
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6">
                <div className="w-full max-w-md">
                    {/* Logo móvil */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="bg-white rounded-full p-2 mx-auto mb-4 inline-block shadow">
                            <img src="/escudo.png" alt="Escudo" className="w-20 h-auto" />
                        </div>
                        <h1 className="text-xl font-bold text-muni-700">Sistema de Acuerdos</h1>
                        <p className="text-slate-500 text-sm">Municipalidad de Flores</p>
                    </div>

                    <div className="card p-8">
                        <div className="mb-7">
                            <h2 className="text-2xl font-bold text-slate-800">Bienvenido</h2>
                            <p className="text-slate-500 text-sm mt-1">Ingrese sus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Mensaje de error inline */}
                            {error && (
                                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
                                    <MdError size={18} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Correo electrónico
                                </label>
                                <div className="relative">
                                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="email" value={form.correo}
                                        onChange={e => { setForm({ ...form, correo: e.target.value }); setError(''); }}
                                        placeholder="usuario@flores.go.cr"
                                        required className="input pl-9" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type={verPassword ? 'text' : 'password'} value={form.password}
                                        onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                                        placeholder="••••••••"
                                        required className="input pl-9 pr-10" />
                                    <button type="button" onClick={() => setVerPassword(!verPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {verPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={cargando}
                                className="w-full btn-primary justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                                {cargando ? 'Verificando...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-slate-400 text-xs mt-6">
                        © 2026 Municipalidad de Flores · Todos los derechos reservados
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
