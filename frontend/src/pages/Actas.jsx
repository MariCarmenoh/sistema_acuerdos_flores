import { useState, useEffect, useCallback } from 'react';
import api, { API_BASE_URL } from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { MdAdd, MdPictureAsPdf, MdSearch, MdClear, MdCalendarToday, MdPerson, MdEdit, MdDelete } from 'react-icons/md';
import ModalConfirmar from '../components/ModalConfirmar';

const Actas = () => {
    const [actas, setActas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtros, setFiltros] = useState({ buscar: '', tipo_sesion: '', fecha: '' });
    const [modalNueva, setModalNueva] = useState(false);
    const [editando, setEditando] = useState(null);
    const [confirmarEliminar, setConfirmarEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''));
            const { data } = await api.get('/actas', { params });
            setActas(data);
        } catch { toast.error('No se pudieron cargar las actas. Verifique su conexión.'); }
        finally { setCargando(false); }
    }, [filtros]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleEliminar = async () => {
        setEliminando(true);
        try {
            await api.delete(`/actas/${confirmarEliminar.numero_acta}`);
            toast.success('Acta eliminada correctamente.');
            setConfirmarEliminar(null);
            cargar();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo eliminar el acta.');
        } finally {
            setEliminando(false);
        }
    };

    const limpiar = () => setFiltros({ buscar: '', tipo_sesion: '', fecha: '' });
    const hayFiltros = Object.values(filtros).some(v => v !== '');

    const verPdf = (numero_acta) => {
        const token = localStorage.getItem('token');
        window.open(`${API_BASE_URL}/actas/${numero_acta}/pdf?token=${token}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-start justify-between mb-6">
                    <div className="page-header mb-0">
                        <h1 className="page-title">Actas Municipales</h1>
                        <p className="page-subtitle">Registro y consulta de actas de sesiones · Municipalidad de Flores</p>
                    </div>
                    <button onClick={() => setModalNueva(true)} className="btn-primary">
                        <MdAdd size={20} /> Nueva Acta
                    </button>
                </div>

                {/* Buscador */}
                <div className="card p-4 mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Buscar por número de acta..."
                                value={filtros.buscar}
                                onChange={e => setFiltros({ ...filtros, buscar: e.target.value })}
                                className="input pl-9" />
                        </div>
                        <select value={filtros.tipo_sesion}
                            onChange={e => setFiltros({ ...filtros, tipo_sesion: e.target.value })}
                            className="input text-slate-600">
                            <option value="">Todos los tipos</option>
                            <option value="Ordinaria">Ordinaria</option>
                            <option value="Extraordinaria">Extraordinaria</option>
                        </select>
                        <div className="flex gap-2">
                            <input type="date" value={filtros.fecha}
                                onChange={e => setFiltros({ ...filtros, fecha: e.target.value })}
                                className="input flex-1" />
                            {hayFiltros && (
                                <button onClick={limpiar} className="btn-secondary px-3">
                                    <MdClear size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="card overflow-hidden">
                    {cargando ? (
                        <div className="p-10 text-center text-slate-400 text-sm">Cargando actas...</div>
                    ) : actas.length === 0 ? (
                        <div className="p-10 text-center">
                            <MdSearch size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm font-medium">No se encontraron actas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="tabla-header">
                                    <tr>
                                        <th className="tabla-th">Número</th>
                                        <th className="tabla-th">Tipo Sesión</th>
                                        <th className="tabla-th">Fecha Sesión</th>
                                        <th className="tabla-th">Registrado por</th>
                                        <th className="tabla-th">Fecha Registro</th>
                                        <th className="tabla-th">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actas.map(a => (
                                        <tr key={a.numero_acta} className="tabla-tr">
                                            <td className="tabla-td font-semibold text-muni-700">{a.numero_acta}</td>
                                            <td className="tabla-td">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                                                    ${a.tipo_sesion === 'Ordinaria'
                                                        ? 'bg-muni-50 text-muni-700 border-muni-200'
                                                        : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                                    {a.tipo_sesion}
                                                </span>
                                            </td>
                                            <td className="tabla-td">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <MdCalendarToday size={14} className="text-slate-400" />
                                                    {new Date(a.fecha_sesion).toLocaleDateString('es-CR')}
                                                </div>
                                            </td>
                                            <td className="tabla-td">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <MdPerson size={14} className="text-slate-400" />
                                                    {a.registrado_por}
                                                </div>
                                            </td>
                                            <td className="tabla-td text-slate-500 text-xs">
                                                {new Date(a.fecha_registro).toLocaleString('es-CR')}
                                            </td>
                                            <td className="tabla-td">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => verPdf(a.numero_acta)}
                                                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium text-xs transition-colors">
                                                        <MdPictureAsPdf size={18} /> Ver PDF
                                                    </button>
                                                    <button onClick={() => setEditando(a)}
                                                        className="text-muni-700 hover:text-muni-800 transition-colors" title="Editar">
                                                        <MdEdit size={18} />
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

            {editando && (
                <ModalEditarActa
                    acta={editando}
                    onClose={() => setEditando(null)}
                    onExito={() => { setEditando(null); cargar(); }}
                />
            )}

            <ModalConfirmar
                abierto={!!confirmarEliminar}
                titulo="Eliminar Acta"
                mensaje={`¿Está segura de que desea eliminar el acta ${confirmarEliminar?.numero_acta}?`}
                detalle="Solo se puede eliminar si no tiene acuerdos asociados. Esta acción también eliminará el PDF del acta."
                textoConfirmar="Sí, eliminar"
                onCancelar={() => setConfirmarEliminar(null)}
                onConfirmar={handleEliminar}
                cargando={eliminando}
            />

            {modalNueva && (
                <ModalNuevaActa
                    onClose={() => setModalNueva(false)}
                    onExito={() => { setModalNueva(false); cargar(); }}
                />
            )}
        </div>
    );
};

const ModalEditarActa = ({ acta, onClose, onExito }) => {
    const [form, setForm] = useState({
        tipo_sesion: acta.tipo_sesion,
        fecha_sesion: acta.fecha_sesion?.split('T')[0] || ''
    });
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            await api.put(`/actas/${acta.numero_acta}`, form);
            toast.success('Acta actualizada correctamente.');
            onExito();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo actualizar el acta.');
        } finally { setCargando(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Editar Acta</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{acta.numero_acta}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Sesión</label>
                        <select value={form.tipo_sesion}
                            onChange={e => setForm({ ...form, tipo_sesion: e.target.value })}
                            className="input">
                            <option value="Ordinaria">Ordinaria</option>
                            <option value="Extraordinaria">Extraordinaria</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fecha de Sesión</label>
                        <input type="date" value={form.fecha_sesion}
                            onChange={e => setForm({ ...form, fecha_sesion: e.target.value })}
                            className="input" required />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
                            {cargando ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ModalNuevaActa = ({ onClose, onExito }) => {
    const [form, setForm] = useState({ numero_acta: '', tipo_sesion: 'Ordinaria', fecha_sesion: '' });
    const [archivo, setArchivo] = useState(null);
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!archivo) return toast.error('Debe seleccionar el archivo PDF del acta.');
        if (!form.numero_acta) return toast.error('El número de acta es requerido.');
        if (!form.fecha_sesion) return toast.error('La fecha de sesión es requerida.');

        setCargando(true);
        const formData = new FormData();
        formData.append('numero_acta', form.numero_acta);
        formData.append('tipo_sesion', form.tipo_sesion);
        formData.append('fecha_sesion', form.fecha_sesion);
        formData.append('archivo_pdf', archivo);
        try {
            await api.post('/actas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Acta registrada correctamente.');
            onExito();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo registrar el acta. Verifique los datos e intente de nuevo.');
        } finally { setCargando(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-bold text-slate-800">Nueva Acta</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Complete la información de la nueva acta</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Número de Acta <span className="text-red-500">*</span>
                            </label>
                            <input type="text" value={form.numero_acta}
                                onChange={e => setForm({ ...form, numero_acta: e.target.value })}
                                placeholder="ACT-2026-001" className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Fecha de Sesión <span className="text-red-500">*</span>
                            </label>
                            <input type="date" value={form.fecha_sesion}
                                onChange={e => setForm({ ...form, fecha_sesion: e.target.value })}
                                className="input" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Tipo de Sesión <span className="text-red-500">*</span>
                        </label>
                        <select value={form.tipo_sesion}
                            onChange={e => setForm({ ...form, tipo_sesion: e.target.value })}
                            className="input">
                            <option value="Ordinaria">Ordinaria</option>
                            <option value="Extraordinaria">Extraordinaria</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Archivo PDF del Acta <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-muni-700 transition-colors">
                            <input type="file" accept=".pdf" id="pdf-input"
                                onChange={e => setArchivo(e.target.files[0])}
                                className="hidden" />
                            <label htmlFor="pdf-input" className="cursor-pointer">
                                <MdPictureAsPdf size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">
                                    {archivo ? archivo.name : 'Seleccionar archivo PDF'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Solo PDF · Máximo 80MB</p>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
                            {cargando ? 'Registrando...' : 'Crear Acta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Actas;
