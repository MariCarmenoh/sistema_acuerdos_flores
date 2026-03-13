import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { MdHistory, MdAdd, MdEdit, MdDelete, MdSearch, MdClear } from 'react-icons/md';

const colorAccion = {
    INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
};
const labelAccion = { INSERT: 'Creación', UPDATE: 'Modificación', DELETE: 'Eliminación' };

const IconAccion = ({ accion }) => {
    if (accion === 'INSERT') return <MdAdd size={13} />;
    if (accion === 'UPDATE') return <MdEdit size={13} />;
    if (accion === 'DELETE') return <MdDelete size={13} />;
    return null;
};

const HistorialGlobal = () => {
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscar, setBuscar] = useState('');
    const [filtroAccion, setFiltroAccion] = useState('');

    useEffect(() => {
        api.get('/historial')
            .then(({ data }) => setRegistros(data))
            .catch(() => toast.error('No se pudo cargar el historial.'))
            .finally(() => setCargando(false));
    }, []);

    const filtrados = registros.filter(r => {
        const texto = `${r.registro_id} ${r.detalle || ''} ${r.usuario || ''} ${r.tabla_afectada}`.toLowerCase();
        const coincideTexto = !buscar || texto.includes(buscar.toLowerCase());
        const coincideAccion = !filtroAccion || r.accion === filtroAccion;
        return coincideTexto && coincideAccion;
    });

    const conteo = (accion) => registros.filter(r => r.accion === accion).length;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="page-header">
                    <h1 className="page-title">Historial de Cambios</h1>
                    <p className="page-subtitle">Registro completo de auditoría del sistema · Municipalidad de Flores</p>
                </div>

                {/* Tarjetas resumen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Registros', valor: registros.length, color: 'text-muni-700', icon: <MdHistory size={20} /> },
                        { label: 'Creaciones',      valor: conteo('INSERT'), color: 'text-emerald-600', icon: <MdAdd size={20} /> },
                        { label: 'Modificaciones',  valor: conteo('UPDATE'), color: 'text-blue-600',    icon: <MdEdit size={20} /> },
                        { label: 'Eliminaciones',   valor: conteo('DELETE'), color: 'text-red-600',     icon: <MdDelete size={20} /> },
                    ].map(t => (
                        <div key={t.label} className="card p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">{t.label}</p>
                                    <p className={"text-2xl font-bold mt-1 " + t.color}>{cargando ? '—' : t.valor}</p>
                                </div>
                                <div className={t.color + " opacity-60"}>{t.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <div className="card p-4 mb-5">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text"
                                placeholder="Buscar por ID, detalle o usuario..."
                                value={buscar} onChange={e => setBuscar(e.target.value)}
                                className="input pl-9" />
                        </div>
                        <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)}
                            className="input w-48">
                            <option value="">Todas las acciones</option>
                            <option value="INSERT">Creación</option>
                            <option value="UPDATE">Modificación</option>
                            <option value="DELETE">Eliminación</option>
                        </select>
                        {(buscar || filtroAccion) && (
                            <button onClick={() => { setBuscar(''); setFiltroAccion(''); }}
                                className="btn-secondary px-3">
                                <MdClear size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabla */}
                <div className="card overflow-hidden">
                    {cargando ? (
                        <div className="p-10 text-center text-slate-400 text-sm">Cargando historial...</div>
                    ) : filtrados.length === 0 ? (
                        <div className="p-10 text-center">
                            <MdHistory size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm">No hay registros.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="tabla-header">
                                    <tr>
                                        <th className="tabla-th">ID</th>
                                        <th className="tabla-th">Fecha y Hora</th>
                                        <th className="tabla-th">Tabla</th>
                                        <th className="tabla-th">Registro</th>
                                        <th className="tabla-th">Acción</th>
                                        <th className="tabla-th">Usuario</th>
                                        <th className="tabla-th">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((r, i) => (
                                        <tr key={i} className="tabla-tr">
                                            <td className="tabla-td text-slate-400 font-mono text-xs">#{r.id_historial}</td>
                                            <td className="tabla-td text-slate-500 whitespace-nowrap text-xs">
                                                {new Date(r.fecha).toLocaleString('es-CR')}
                                            </td>
                                            <td className="tabla-td">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                                    {r.tabla_afectada}
                                                </span>
                                            </td>
                                            <td className="tabla-td font-medium text-muni-700 text-xs">{r.registro_id}</td>
                                            <td className="tabla-td">
                                                <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border " + (colorAccion[r.accion] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                                                    <IconAccion accion={r.accion} />
                                                    {labelAccion[r.accion] || r.accion}
                                                </span>
                                            </td>
                                            <td className="tabla-td text-slate-600 text-xs">{r.usuario || 'Sistema'}</td>
                                            <td className="tabla-td text-slate-600 max-w-sm">
                                                <p className="break-words whitespace-pre-wrap text-xs leading-relaxed">{r.detalle || '—'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HistorialGlobal;
