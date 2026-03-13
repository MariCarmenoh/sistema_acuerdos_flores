import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdDashboard, MdGavel, MdDescription, MdPeopleAlt,
    MdLogout, MdMenu, MdClose, MdHistory
} from 'react-icons/md';
import { useState } from 'react';

const Navbar = () => {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuAbierto, setMenuAbierto] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: <MdDashboard size={18} /> },
        { to: '/acuerdos',  label: 'Acuerdos',  icon: <MdGavel size={18} /> },
        { to: '/actas',     label: 'Actas',      icon: <MdDescription size={18} /> },
        { to: '/historial', label: 'Historial',  icon: <MdHistory size={18} /> },
        ...(usuario?.rol === 'Administrador'
            ? [{ to: '/usuarios', label: 'Usuarios', icon: <MdPeopleAlt size={18} /> }]
            : []),
    ];

    const esActivo = (path) => location.pathname.startsWith(path);

    return (
        <nav className="bg-white border-b border-slate-200 shadow-navbar sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <img src="/escudo.png" alt="Escudo Municipalidad de Flores" className="h-10 w-auto" />
                        <div className="hidden sm:block">
                            <p className="font-bold text-sm text-muni-700 leading-tight">Sistema Municipal</p>
                            <p className="text-slate-400 text-xs">Municipalidad de Flores</p>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => (
                            <Link key={link.to} to={link.to}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                    ${esActivo(link.to)
                                        ? 'bg-muni-700 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-muni-700'}`}>
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-slate-800">{usuario?.nombre} {usuario?.apellidos}</p>
                            <p className="text-xs text-slate-400">{usuario?.correo}</p>
                        </div>
                        <button onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
                            <MdLogout size={18} /> Salir
                        </button>
                    </div>

                    <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMenuAbierto(!menuAbierto)}>
                        {menuAbierto ? <MdClose size={24} /> : <MdMenu size={24} />}
                    </button>
                </div>

                {menuAbierto && (
                    <div className="md:hidden pb-3 space-y-1 border-t border-slate-100 pt-2">
                        {links.map(link => (
                            <Link key={link.to} to={link.to} onClick={() => setMenuAbierto(false)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                                    ${esActivo(link.to) ? 'bg-muni-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                                {link.icon} {link.label}
                            </Link>
                        ))}
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">
                            <MdLogout size={18} /> Cerrar sesión
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
