import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Semaforo from '../components/Semaforo';
import { MdGavel, MdCheckCircle, MdWarning, MdAccessTime, MdArrowForward, MdBarChart } from 'react-icons/md';

const Dashboard = () => {
    const [datos, setDatos] = useState({ resumen: { Pendiente: 0, Cumplido: 0, Vencido: 0 }, recientes: [] });
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/acuerdos/dashboard')
            .then(({ data }) => setDatos(data))
            .finally(() => setCargando(false));
    }, []);

    const total = datos.resumen.Pendiente + datos.resumen.Cumplido + datos.resumen.Vencido;
    const pct = (v) => total > 0 ? Math.round((v / total) * 100) : 0;

    const tarjetas = [
        {
            label: 'Pendientes', valor: datos.resumen.Pendiente,
            icon: <MdAccessTime size={24} />, color: 'amber',
            bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
            iconBg: 'bg-amber-100', filtro: 'Pendiente'
        },
        {
            label: 'Cumplidos', valor: datos.resumen.Cumplido,
            icon: <MdCheckCircle size={24} />, color: 'emerald',
            bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
            iconBg: 'bg-emerald-100', filtro: 'Cumplido'
        },
        {
            label: 'Vencidos', valor: datos.resumen.Vencido,
            icon: <MdWarning size={24} />, color: 'red',
            bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
            iconBg: 'bg-red-100', filtro: 'Vencido'
        },
    ];

    const barras = [
        { label: 'Cumplidos', valor: datos.resumen.Cumplido, color: 'bg-emerald-500' },
        { label: 'Pendientes', valor: datos.resumen.Pendiente, color: 'bg-amber-400' },
        { label: 'Vencidos', valor: datos.resumen.Vencido, color: 'bg-red-500' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="page-header">
                    <h1 className="page-title">Panel de Control</h1>
                    <p className="page-subtitle">Municipalidad de Flores · Resumen de acuerdos y actas</p>
                </div>

                {/* Tarjetas clickeables */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {tarjetas.map(t => (
                        <button key={t.label} onClick={() => navigate(`/acuerdos?estado=${t.filtro}`)}
                            className={`card border ${t.border} p-5 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600">{t.label}</p>
                                    <p className={`text-4xl font-bold mt-2 ${t.text}`}>
                                        {cargando ? '—' : t.valor}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {cargando ? '' : `${pct(t.valor)}% del total`}
                                    </p>
                                </div>
                                <div className={`p-2.5 rounded-xl ${t.iconBg} ${t.text}`}>{t.icon}</div>
                            </div>
                            <div className={`mt-3 text-xs font-medium ${t.text} flex items-center gap-1`}>
                                Click para ver detalles <MdArrowForward size={14} />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Distribución de estados */}
                    <div className="card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <MdBarChart className="text-muni-700" size={20} />
                            <h2 className="font-semibold text-slate-800">Distribución de Estados</h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Porcentaje de acuerdos por estado</p>
                        <div className="space-y-4">
                            {barras.map(b => (
                                <div key={b.label}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-slate-700">{b.label}</span>
                                        <span className="text-slate-500 font-semibold">{pct(b.valor)}%</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-700 ${b.color}`}
                                            style={{ width: `${pct(b.valor)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
                            <span className="text-slate-500">Total de acuerdos</span>
                            <span className="font-bold text-muni-700">{total}</span>
                        </div>
                        <div className="mt-1 flex justify-between text-sm">
                            <span className="text-slate-500">Tasa de cumplimiento</span>
                            <span className="font-bold text-emerald-600">{pct(datos.resumen.Cumplido)}%</span>
                        </div>
                    </div>

                    {/* Acuerdos recientes */}
                    <div className="card lg:col-span-2">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <MdGavel className="text-muni-700" size={20} />
                                <h2 className="font-semibold text-slate-800">Acuerdos Recientes</h2>
                            </div>
                            <Link to="/acuerdos" className="text-sm text-muni-700 hover:underline font-medium flex items-center gap-1">
                                Ver todos <MdArrowForward size={16} />
                            </Link>
                        </div>

                        {cargando ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
                        ) : datos.recientes.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No hay acuerdos registrados.</div>
                        ) : (
                            <div>
                                {datos.recientes.map(a => (
                                    <div key={a.numero_acuerdo} className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-0">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-muni-700">{a.numero_acuerdo}</span>
                                                <span className="text-xs text-slate-400">·</span>
                                                <span className="text-xs text-slate-400">{a.tipo_sesion}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-0.5 truncate">{a.asunto}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {new Date(a.fecha_acuerdo).toLocaleDateString('es-CR')}
                                            </p>
                                        </div>
                                        <Semaforo color={a.semaforo} estado={a.estado} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
