import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { MdArrowBack, MdHistory, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const colorAccion = {
    INSERT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
};

const labelAccion = {
    INSERT: 'Creación',
    UPDATE: 'Modificación',
    DELETE: 'Eliminación',
};

const Historial = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [historial, setHistorial] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get('/acuerdos/' + id + '/historial')
            .then(({ data }) => setHistorial(data))
            .catch(() => toast.error('No se pudo cargar el historial.'))
            .finally(() => setCargando(false));
    }, [id]);

    const IconAccion = ({ accion }) => {
        if (accion === 'INSERT') return <MdAdd size={14} />;
        if (accion === 'UPDATE') return <MdEdit size={14} />;
        if (accion === 'DELETE') return <MdDelete size={14} />;
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/acuerdos')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-muni-700 mb-6 transition-colors">
                    <MdArrowBack size={18} /> Volver a acuerdos
                </button>

                <div className="card overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <div className="p-2 bg-muni-100 rounded-lg">
                            <MdHistory className="text-muni-700" size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800">Historial de Cambios</h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Acuerdo: <span className="font-semibold text-muni-700">{id}</span>
                            </p>
                        </div>
                    </div>

                    {cargando ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Cargando historial...</div>
                    ) : historial.length === 0 ? (
                        <div className="p-8 text-center">
                            <MdHistory size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm">No hay registros en el historial aún.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {historial.map((h, i) => (
                                <div key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <span className={"mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border " + (colorAccion[h.accion] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                                                <IconAccion accion={h.accion} />
                                                {labelAccion[h.accion] || h.accion}
                                            </span>
                                            <div>
                                                <p className="text-sm text-slate-700">{h.detalle || '—'}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {h.usuario || 'Sistema automático'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(h.fecha).toLocaleString('es-CR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Historial;
