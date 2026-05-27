import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/axios';
import Navbar from '../components/Navbar';
import ModalConfirmar from '../components/ModalConfirmar';
import toast from 'react-hot-toast';
import { MdArrowBack, MdSave, MdUploadFile, MdPictureAsPdf, MdDelete, MdAdd, MdSearch } from 'react-icons/md';

const FormAcuerdo = () => {
    const { id } = useParams();
    const esEdicion = !!id;
    const navigate = useNavigate();

    const [form, setForm] = useState({
        numero_acuerdo: '', asunto: '', fecha_acuerdo: '',
        estado: 'Pendiente', plazo_dias: '', fecha_respuesta: '', numero_acta: ''
    });
    const [actas, setActas] = useState([]);
    const [actasFiltradas, setActasFiltradas] = useState([]);
    const [buscarActa, setBuscarActa] = useState('');
    const [mostrarActas, setMostrarActas] = useState(false);
    const [oficios, setOficios] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [subiendoOficio, setSubiendoOficio] = useState(false);
    const [acuerdoGuardado, setAcuerdoGuardado] = useState(esEdicion ? id : null);
    const [confirmarOficio, setConfirmarOficio] = useState(null);
    const [eliminandoOficio, setEliminandoOficio] = useState(false);
    const actaRef = useRef(null);

    useEffect(() => {
        api.get('/actas').then(({ data }) => {
            setActas(data);
            setActasFiltradas(data);
        });
        if (esEdicion) {
            api.get(`/acuerdos?numero_acuerdo=${id}`)
                .then(({ data }) => {
                    if (data.length > 0) {
                        const a = data[0];
                        setForm({
                            numero_acuerdo: a.numero_acuerdo,
                            asunto: a.asunto,
                            fecha_acuerdo: a.fecha_acuerdo?.split('T')[0] || '',
                            estado: a.estado,
                            plazo_dias: a.plazo_dias ?? '',
                            fecha_respuesta: a.fecha_respuesta?.split('T')[0] || '',
                            numero_acta: a.numero_acta
                        });
                        setBuscarActa(a.numero_acta);
                    }
                });
            cargarOficios(id);
        }
    }, [esEdicion, id]);

    useEffect(() => {
        const filtro = buscarActa.toLowerCase();
        setActasFiltradas(
            actas.filter(a =>
                a.numero_acta.toLowerCase().includes(filtro) ||
                a.tipo_sesion.toLowerCase().includes(filtro)
            )
        );
    }, [buscarActa, actas]);

    useEffect(() => {
        const handler = (e) => {
            if (actaRef.current && !actaRef.current.contains(e.target)) {
                setMostrarActas(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const cargarOficios = (numAcuerdo) => {
        api.get(`/acuerdos/${numAcuerdo}/oficios`)
            .then(({ data }) => setOficios(data))
            .catch(() => {});
    };

    const seleccionarActa = (acta) => {
        setForm(f => ({ ...f, numero_acta: acta.numero_acta }));
        setBuscarActa(acta.numero_acta);
        setMostrarActas(false);
    };

    const guardarAcuerdo = async () => {
        if (form.estado === 'Cumplido' && !form.fecha_respuesta && !esEdicion) {
            toast.error('Debe ingresar la fecha de respuesta para marcar el acuerdo como Cumplido.');
            return null;
        }
        if (!form.numero_acuerdo || !form.asunto || !form.fecha_acuerdo || !form.numero_acta) {
            toast.error('Complete los campos obligatorios antes de continuar.');
            return null;
        }
        try {
            if (esEdicion || acuerdoGuardado) {
                await api.put(`/acuerdos/${acuerdoGuardado || id}`, form);
            } else {
                await api.post('/acuerdos', form);
                setAcuerdoGuardado(form.numero_acuerdo);
            }
            return form.numero_acuerdo;
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo guardar el acuerdo.');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        const resultado = await guardarAcuerdo();
        setCargando(false);
        if (resultado) {
            toast.success(esEdicion ? 'Acuerdo actualizado correctamente.' : 'Acuerdo registrado correctamente.');
            navigate('/acuerdos');
        }
    };

    const handleSubirOficio = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        let numAcuerdo = acuerdoGuardado;
        if (!numAcuerdo) {
            numAcuerdo = await guardarAcuerdo();
            if (!numAcuerdo) return;
            toast.success('Acuerdo guardado. Ahora puede agregar oficios.');
        }
        setSubiendoOficio(true);
        const formData = new FormData();
        formData.append('archivo_pdf', archivo);
        try {
            await api.post(`/acuerdos/${numAcuerdo}/oficios`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Oficio agregado correctamente.');
            cargarOficios(numAcuerdo);
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo subir el oficio.');
        } finally {
            setSubiendoOficio(false);
            e.target.value = '';
        }
    };

    const confirmarEliminarOficio = async () => {
        const numAcuerdo = acuerdoGuardado || id;
        setEliminandoOficio(true);
        try {
            await api.delete(`/acuerdos/${numAcuerdo}/oficios/${confirmarOficio}`);
            toast.success('Oficio eliminado.');
            cargarOficios(numAcuerdo);
            setConfirmarOficio(null);
        } catch {
            toast.error('No se pudo eliminar el oficio.');
        } finally {
            setEliminandoOficio(false);
        }
    };

    const verOficio = (id_oficio) => {
        const numAcuerdo = acuerdoGuardado || id;
        const token = localStorage.getItem('token');
        window.open(`${API_BASE_URL}/acuerdos/${numAcuerdo}/oficios/${id_oficio}/pdf?token=${token}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/acuerdos')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-muni-700 mb-6 transition-colors">
                    <MdArrowBack size={18} /> Volver a acuerdos
                </button>

                {/* Formulario */}
                <div className="card p-6 mb-5">
                    <div className="mb-6 pb-5 border-b border-slate-100">
                        <h1 className="page-title">{esEdicion ? 'Editar Acuerdo' : 'Nuevo Acuerdo'}</h1>
                        <p className="page-subtitle">Complete la información del acuerdo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Número de Acuerdo <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={form.numero_acuerdo}
                                    onChange={e => setForm({ ...form, numero_acuerdo: e.target.value })}
                                    placeholder="699-B-2025" className="input"
                                    disabled={esEdicion || !!acuerdoGuardado} required />
                            </div>

                            {/* Selector de acta con búsqueda */}
                            <div ref={actaRef} className="relative">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Número de Acta <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="text"
                                        value={buscarActa}
                                        onChange={e => { setBuscarActa(e.target.value); setMostrarActas(true); setForm(f => ({ ...f, numero_acta: '' })); }}
                                        onFocus={() => setMostrarActas(true)}
                                        placeholder="Buscar acta..."
                                        className={"input pl-8 " + (!form.numero_acta ? '' : 'border-muni-700')} />
                                    {form.numero_acta && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-muni-700 rounded-full" />
                                    )}
                                </div>
                                {mostrarActas && actasFiltradas.length > 0 && (
                                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-modal overflow-hidden">
                                        <div className="max-h-48 overflow-y-auto">
                                            {actasFiltradas.map(a => (
                                                <button key={a.numero_acta} type="button"
                                                    onClick={() => seleccionarActa(a)}
                                                    className={"w-full text-left px-4 py-2.5 hover:bg-muni-50 transition-colors text-sm " +
                                                        (form.numero_acta === a.numero_acta ? 'bg-muni-50 text-muni-700 font-semibold' : 'text-slate-700')}>
                                                    <span className="font-medium">{a.numero_acta}</span>
                                                    <span className="text-slate-400 text-xs ml-2">
                                                        {a.tipo_sesion} · {new Date(a.fecha_sesion).toLocaleDateString('es-CR')}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {mostrarActas && actasFiltradas.length === 0 && buscarActa && (
                                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-modal p-3 text-sm text-slate-400">
                                        No se encontraron actas.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Asunto <span className="text-red-500">*</span>
                            </label>
                            <textarea value={form.asunto}
                                onChange={e => setForm({ ...form, asunto: e.target.value })}
                                placeholder="Descripción del asunto del acuerdo"
                                rows={3} className="input resize-none" required />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Fecha del Acuerdo <span className="text-red-500">*</span>
                                </label>
                                <input type="date" value={form.fecha_acuerdo}
                                    onChange={e => setForm({ ...form, fecha_acuerdo: e.target.value })}
                                    className="input" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Estado <span className="text-red-500">*</span>
                                </label>
                                <select value={form.estado}
                                    onChange={e => setForm({ ...form, estado: e.target.value })}
                                    className="input">
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Cumplido">Cumplido</option>
                                    <option value="Vencido">Vencido</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Plazo (días naturales)
                                    <span className="text-slate-400 font-normal ml-1 text-xs">— opcional</span>
                                </label>
                                <input type="number" min="0" value={form.plazo_dias}
                                    onChange={e => setForm({ ...form, plazo_dias: e.target.value })}
                                    placeholder="Dejar vacío si no aplica" className="input" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Fecha de Respuesta
                                    {form.estado === 'Cumplido' && !form.fecha_respuesta && !esEdicion && (
                                        <span className="text-red-500"> *</span>
                                    )}
                                </label>
                                <input type="date" value={form.fecha_respuesta}
                                    onChange={e => setForm({ ...form, fecha_respuesta: e.target.value })}
                                    className="input" />
                                {form.estado === 'Cumplido' && !form.fecha_respuesta && !esEdicion && (
                                    <p className="text-xs text-red-500 mt-1">Requerida cuando el estado es Cumplido</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => navigate('/acuerdos')} className="btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
                                <MdSave size={18} />
                                {cargando ? 'Guardando...' : 'Guardar Acuerdo'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sección de oficios */}
                <div className="card overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div>
                            <h2 className="font-bold text-slate-800">Oficios</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {acuerdoGuardado
                                    ? 'PDFs de oficios asociados a este acuerdo'
                                    : 'Haga click en "Agregar Oficio" para guardar el acuerdo y subir el PDF'}
                            </p>
                        </div>
                        <label className={"btn-primary " + (subiendoOficio ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer')}>
                            <MdAdd size={18} />
                            {subiendoOficio ? 'Subiendo...' : 'Agregar Oficio'}
                            <input type="file" accept=".pdf" onChange={handleSubirOficio}
                                disabled={subiendoOficio} className="hidden" />
                        </label>
                    </div>

                    {oficios.length === 0 ? (
                        <div className="p-8 text-center">
                            <MdUploadFile size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm">No hay oficios registrados.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {oficios.map((o, i) => (
                                <div key={o.id_oficio} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg">
                                            <MdPictureAsPdf size={20} className="text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]" title={o.nombre_archivo}>
                                                {o.nombre_archivo || `Oficio ${i + 1}`}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(o.fecha_registro).toLocaleDateString('es-CR')} · {o.registrado_por}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => verOficio(o.id_oficio)}
                                            className="btn-secondary text-xs py-1.5 px-3">
                                            <MdPictureAsPdf size={16} /> Ver PDF
                                        </button>
                                        <button onClick={() => setConfirmarOficio(o.id_oficio)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <MdDelete size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <ModalConfirmar
                    abierto={!!confirmarOficio}
                    titulo="Eliminar Oficio"
                    mensaje="¿Está segura de que desea eliminar este oficio?"
                    detalle="El archivo PDF será eliminado permanentemente."
                    textoConfirmar="Sí, eliminar"
                    onCancelar={() => setConfirmarOficio(null)}
                    onConfirmar={confirmarEliminarOficio}
                    cargando={eliminandoOficio}
                />
            </main>
        </div>
    );
};

export default FormAcuerdo;
