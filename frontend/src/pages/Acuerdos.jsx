import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Semaforo from '../components/Semaforo';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdClear, MdEdit, MdHistory, MdClose, MdDescription, MdDelete } from 'react-icons/md';
import ModalConfirmar from '../components/ModalConfirmar';

const TABS = [
    { label: 'Todas',      valor: '' },
    { label: 'Pendientes', valor: 'Pendiente' },
    { label: 'Cumplidos',  valor: 'Cumplido' },
    { label: 'Vencidos',   valor: 'Vencido' },
];

const tabColor = {
    '':          'bg-slate-800 text-white',
    'Pendiente': 'bg-amber-500 text-white',
    'Cumplido':  'bg-emerald-600 text-white',
    'Vencido':   'bg-red-600 text-white',
};

const Acuerdos = () => {
    const [searchParams] = useSearchParams();
    const [acuerdos, setAcuerdos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [tabActiva, setTabActiva] = useState(searchParams.get('estado') || '');
    const [busqueda, setBusqueda] = useState('');
    const [fecha, setFecha] = useState('');
    const [detalle, setDetalle] = useState(null);
    const [oficiosDetalle, setOficiosDetalle] = useState([]);
    const [confirmarEliminar, setConfirmarEliminar] = useState(null); 
    const [eliminando, setEliminando] = useState(false);
    const navigate = useNavigate();

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const params = {};
            if (tabActiva) params.estado = tabActiva;
            if (busqueda) {
                // Envía como búsqueda general — el backend busca en número de acuerdo,
                // número de acta y asunto al mismo tiempo
                params.busqueda = busqueda;
            }
            if (fecha) params.fecha = fecha;
            const { data } = await api.get('/acuerdos', { params });
            setAcuerdos(data);
        } catch {
            toast.error('No se pudieron cargar los acuerdos. Verifique su conexión.');
        } finally {
            setCargando(false);
        }
    }, [tabActiva, busqueda, fecha]);

    useEffect(() => { cargar(); }, [cargar]);

    const limpiar = () => { setBusqueda(''); setFecha(''); };
    const hayFiltros = busqueda || fecha;

    const handleEliminar = async () => {
        if (!confirmarEliminar) return;
        setEliminando(true);
        try {
            await api.delete(`/acuerdos/${confirmarEliminar.numero_acuerdo}`);
            toast.success('Acuerdo eliminado correctamente.');
            setConfirmarEliminar(null);
            cargar();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo eliminar el acuerdo.');
        } finally {
            setEliminando(false);
        }
    };

    const conteo = (val) => val === '' ? acuerdos.length
        : acuerdos.filter(a => a.estado === val).length;

    const verActa = (numero_acta) => {
        const token = localStorage.getItem('token');
        window.open(`http://localhost:3000/api/actas/${numero_acta}/pdf?token=${token}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="page-title">Acuerdos Municipales</h1>
                        <p className="page-subtitle">Gestión y seguimiento · Municipalidad de Flores</p>
                    </div>
                    <Link to="/acuerdos/nuevo" className="btn-primary">
                        <MdAdd size={20} /> Nuevo Acuerdo
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {TABS.map(tab => (
                        <button key={tab.valor} onClick={() => setTabActiva(tab.valor)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border
                                ${tabActiva === tab.valor
                                    ? `${tabColor[tab.valor]} border-transparent shadow-sm`
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                            {tab.label}
                            {tabActiva === tab.valor && (
                                <span className="ml-1.5 opacity-80">({conteo(tab.valor)})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Buscador — un solo campo */}
                <div className="card p-4 mb-5">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text"
                                placeholder="Buscar por número de acuerdo, número de acta o asunto..."
                                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                className="input pl-9" />
                        </div>
                        <input type="date" value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            className="input w-44" />
                        {hayFiltros && (
                            <button onClick={limpiar} className="btn-secondary px-3">
                                <MdClear size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabla */}
                <div className="card overflow-hidden">
                    {cargando ? (
                        <div className="p-10 text-center text-slate-400 text-sm">Cargando acuerdos...</div>
                    ) : acuerdos.length === 0 ? (
                        <div className="p-10 text-center">
                            <MdSearch size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm font-medium">No se encontraron acuerdos</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="tabla-header">
                                    <tr>
                                        <th className="tabla-th">Número</th>
                                        <th className="tabla-th">Asunto</th>
                                        <th className="tabla-th">Fecha</th>
                                        <th className="tabla-th">Plazo</th>
                                        <th className="tabla-th">Estado</th>
                                        <th className="tabla-th">Acta</th>
                                        <th className="tabla-th">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {acuerdos.map(a => (
                                        <tr key={a.numero_acuerdo} className="tabla-tr">
                                            <td className="tabla-td font-semibold text-muni-700">{a.numero_acuerdo}</td>
                                            <td className="tabla-td max-w-xs">
                                                <button onClick={() => {
                                                        setDetalle(a);
                                                        setOficiosDetalle([]);
                                                        api.get(`/acuerdos/${a.numero_acuerdo}/oficios`)
                                                            .then(({ data }) => setOficiosDetalle(data))
                                                            .catch(() => {});
                                                    }}
                                                    className="text-left text-slate-700 hover:text-muni-700 transition-colors">
                                                    <p className="truncate max-w-[260px]">{a.asunto}</p>
                                                    <p className="text-xs text-muni-700 opacity-60 mt-0.5">Ver detalle →</p>
                                                </button>
                                            </td>
                                            <td className="tabla-td text-slate-500 whitespace-nowrap">
                                                {new Date(a.fecha_acuerdo).toLocaleDateString('es-CR')}
                                            </td>
                                            <td className="tabla-td text-slate-500">
                                                {a.plazo_dias ? `${a.plazo_dias} días` : '—'}
                                            </td>
                                            <td className="tabla-td">
                                                <Semaforo color={a.semaforo} estado={a.estado} />
                                            </td>

                                            <td className="tabla-td">
                                                <button onClick={() => verActa(a.numero_acta)}
                                                    className="text-xs text-muni-700 hover:underline font-medium">
                                                    {a.numero_acta}
                                                </button>
                                            </td>
                                            <td className="tabla-td">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => navigate(`/acuerdos/${encodeURIComponent(a.numero_acuerdo)}/editar`)}
                                                        className="text-muni-700 hover:text-muni-800 transition-colors" title="Editar">
                                                        <MdEdit size={18} />
                                                    </button>
                                                    <button onClick={() => navigate(`/acuerdos/${encodeURIComponent(a.numero_acuerdo)}/historial`)}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors" title="Historial">
                                                        <MdHistory size={18} />
                                                    </button>
                                                    <button onClick={() => setConfirmarEliminar(a)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors" title="Eliminar">
                                                        <MdDelete size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal detalle del acuerdo */}
            {detalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
                    onClick={() => setDetalle(null)}>
                    <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <p className="font-bold text-muni-700">{detalle.numero_acuerdo}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{detalle.tipo_sesion} · {new Date(detalle.fecha_acuerdo).toLocaleDateString('es-CR')}</p>
                            </div>
                            <button onClick={() => setDetalle(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <MdClose size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Asunto</p>
                                <p className="text-slate-800 text-sm leading-relaxed">{detalle.asunto}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Estado</p>
                                    <Semaforo color={detalle.semaforo} estado={detalle.estado} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Plazo</p>
                                    <p className="text-sm text-slate-700">{detalle.plazo_dias ? `${detalle.plazo_dias} días naturales` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Vencimiento</p>
                                    <p className="text-sm text-slate-700">
                                        {detalle.fecha_vencimiento ? new Date(detalle.fecha_vencimiento).toLocaleDateString('es-CR') : '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Acta</p>
                                    <button onClick={() => { setDetalle(null); verActa(detalle.numero_acta); }}
                                        className="text-sm text-muni-700 hover:underline font-medium">
                                        {detalle.numero_acta}
                                    </button>
                                </div>

                            </div>
                        </div>
                        {/* Oficios */}
                        {oficiosDetalle.length > 0 && (
                            <div className="px-6 pb-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Oficios</p>
                                <div className="space-y-1.5">
                                    {oficiosDetalle.map((o, i) => {
                                        const token = localStorage.getItem('token');
                                        return (
                                            <button key={o.id_oficio}
                                                onClick={() => window.open(`http://localhost:3000/api/acuerdos/${detalle.numero_acuerdo}/oficios/${o.id_oficio}/pdf?token=${token}`, '_blank')}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left">
                                                <MdDescription size={16} className="text-red-500 flex-shrink-0" />
                                                <span className="text-sm text-red-700 font-medium truncate max-w-[200px]">
                                                    {o.nombre_archivo || `Oficio ${i + 1}`}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-auto">{new Date(o.fecha_registro).toLocaleDateString('es-CR')}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => { setDetalle(null); navigate(`/acuerdos/${encodeURIComponent(detalle.numero_acuerdo)}/historial`); }}
                                className="btn-secondary text-xs">
                                <MdHistory size={16} /> Historial
                            </button>
                            <button onClick={() => { setDetalle(null); navigate(`/acuerdos/${encodeURIComponent(detalle.numero_acuerdo)}/editar`); }}
                                className="btn-primary text-xs">
                                <MdEdit size={16} /> Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ModalConfirmar
                abierto={!!confirmarEliminar}
                titulo="Eliminar Acuerdo"
                mensaje={`¿Está segura de que desea eliminar el acuerdo ${confirmarEliminar?.numero_acuerdo}?`}
                detalle="Esta acción eliminará permanentemente el acuerdo y todos sus oficios asociados. No se puede deshacer."
                textoConfirmar="Sí, eliminar"
                onCancelar={() => setConfirmarEliminar(null)}
                onConfirmar={handleEliminar}
                cargando={eliminando}
            />
        </div>
    );
};

export default Acuerdos;
