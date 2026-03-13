import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdPersonOff, MdPerson, MdSearch, MdCalendarToday, MdAccessTime, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import ModalConfirmar from '../components/ModalConfirmar';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscar, setBuscar] = useState('');
    const [modalNuevo, setModalNuevo] = useState(false);
    const [editando, setEditando] = useState(null);

    const cargar = () => {
        api.get('/usuarios')
            .then(({ data }) => setUsuarios(data))
            .catch(() => toast.error('Error al cargar usuarios.'))
            .finally(() => setCargando(false));
    };
    useEffect(() => { cargar(); }, []);

    const toggleEstado = async (id, activo) => {
        try {
            await api.put(`/usuarios/${id}/estado`, { activo: !activo });
            toast.success(`Usuario ${!activo ? 'activado' : 'desactivado'} correctamente.`);
            cargar();
        } catch { toast.error('No se pudo cambiar el estado del usuario. Intente de nuevo.'); }
    };

    const filtrados = usuarios.filter(u =>
        `${u.nombre} ${u.apellidos} ${u.correo} ${u.puesto || ''} ${u.rol}`
            .toLowerCase().includes(buscar.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-start justify-between mb-6">
                    <div className="page-header mb-0">
                        <h1 className="page-title">Gestión de Usuarios</h1>
                        <p className="page-subtitle">Administración de usuarios del sistema · Municipalidad de Flores</p>
                    </div>
                    <button onClick={() => setModalNuevo(true)} className="btn-primary">
                        <MdAdd size={20} /> Nuevo Usuario
                    </button>
                </div>

                {/* Buscador */}
                <div className="card p-4 mb-5">
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Buscar por nombre, apellidos, correo, puesto o rol..."
                            value={buscar} onChange={e => setBuscar(e.target.value)}
                            className="input pl-9" />
                    </div>
                </div>

                <div className="card overflow-hidden">
                    {cargando ? (
                        <div className="p-10 text-center text-slate-400 text-sm">Cargando usuarios...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="tabla-header">
                                    <tr>
                                        <th className="tabla-th">ID</th>
                                        <th className="tabla-th">Nombre Completo</th>
                                        <th className="tabla-th">Correo</th>
                                        <th className="tabla-th">Rol</th>
                                        <th className="tabla-th">Puesto</th>
                                        <th className="tabla-th">Estado</th>
                                        <th className="tabla-th">Fecha Creación</th>
                                        <th className="tabla-th">Último Acceso</th>
                                        <th className="tabla-th">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map(u => (
                                        <tr key={u.id_usuario} className="tabla-tr">
                                            <td className="tabla-td text-slate-400 font-mono">#{u.id_usuario}</td>
                                            <td className="tabla-td">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-muni-100 flex items-center justify-center text-muni-700 font-bold text-xs flex-shrink-0">
                                                        {u.nombre[0]}{u.apellidos[0]}
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{u.nombre} {u.apellidos}</span>
                                                </div>
                                            </td>
                                            <td className="tabla-td text-slate-500">{u.correo}</td>
                                            <td className="tabla-td">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                                                    ${u.rol === 'Administrador'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                    {u.rol}
                                                </span>
                                            </td>
                                            <td className="tabla-td text-slate-500">
                                                {u.puesto ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <MdPerson size={14} className="text-slate-400" />
                                                        {u.puesto}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="tabla-td">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border
                                                    ${u.activo
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                    {u.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="tabla-td text-slate-500 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <MdCalendarToday size={12} className="text-slate-400" />
                                                    {new Date(u.fecha_creacion).toLocaleDateString('es-CR')}
                                                </div>
                                            </td>
                                            <td className="tabla-td text-slate-500 text-xs">
                                                {u.ultimo_acceso ? (
                                                    <div className="flex items-center gap-1">
                                                        <MdAccessTime size={12} className="text-slate-400" />
                                                        {new Date(u.ultimo_acceso).toLocaleString('es-CR')}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="tabla-td">
                                                <div className="flex items-center gap-2">
                                                <button onClick={() => setEditando(u)}
                                                    className="p-1.5 rounded-lg text-muni-700 hover:bg-muni-50 transition-colors" title="Editar">
                                                    <MdEdit size={18} />
                                                </button>
                                                <button onClick={() => toggleEstado(u.id_usuario, u.activo)}
                                                    className={`p-1.5 rounded-lg transition-colors ${u.activo
                                                        ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
                                                        : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                                                    title={u.activo ? 'Desactivar' : 'Activar'}>
                                                    {u.activo ? <MdPersonOff size={18} /> : <MdPerson size={18} />}
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
                <ModalEditarUsuario
                    usuario={editando}
                    onClose={() => setEditando(null)}
                    onExito={() => { setEditando(null); cargar(); }}
                />
            )}

            {modalNuevo && (
                <ModalNuevoUsuario
                    onClose={() => setModalNuevo(false)}
                    onExito={() => { setModalNuevo(false); cargar(); }}
                />
            )}
        </div>
    );
};

const ModalEditarUsuario = ({ usuario, onClose, onExito }) => {
    const [form, setForm] = useState({
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        puesto: usuario.puesto || '',
        rol: usuario.rol,
        password: ''
    });
    const [verPass, setVerPass] = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password && form.password.length < 6) {
            return toast.error('La contraseña debe tener al menos 6 caracteres.');
        }
        setCargando(true);
        const datos = { ...form };
        if (!datos.password) delete datos.password;
        try {
            await api.put(`/usuarios/${usuario.id_usuario}`, datos);
            toast.success('Usuario actualizado correctamente.');
            onExito();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo actualizar el usuario.');
        } finally { setCargando(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Editar Usuario</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{usuario.correo}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre</label>
                            <input type="text" value={form.nombre}
                                onChange={e => setForm({ ...form, nombre: e.target.value })}
                                className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Apellidos</label>
                            <input type="text" value={form.apellidos}
                                onChange={e => setForm({ ...form, apellidos: e.target.value })}
                                className="input" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo</label>
                        <input type="email" value={form.correo}
                            onChange={e => setForm({ ...form, correo: e.target.value })}
                            className="input" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol</label>
                            <select value={form.rol}
                                onChange={e => setForm({ ...form, rol: e.target.value })}
                                className="input">
                                <option value="Usuario">Usuario</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Puesto</label>
                            <input type="text" value={form.puesto}
                                onChange={e => setForm({ ...form, puesto: e.target.value })}
                                placeholder="Opcional" className="input" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Nueva Contraseña
                            <span className="text-slate-400 font-normal ml-1 text-xs">— dejar vacío para no cambiar</span>
                        </label>
                        <div className="relative">
                            <input type={verPass ? 'text' : 'password'} value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres" className="input pr-10" />
                            <button type="button" onClick={() => setVerPass(!verPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {verPass ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                            </button>
                        </div>
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

const ModalNuevoUsuario = ({ onClose, onExito }) => {
    const [form, setForm] = useState({ nombre: '', apellidos: '', correo: '', password: '', rol: 'Usuario', puesto: '' });
    const [cargando, setCargando] = useState(false);
    const [verPassNuevo, setVerPassNuevo] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre) return toast.error('El nombre es requerido.');
        if (!form.apellidos) return toast.error('Los apellidos son requeridos.');
        if (!form.correo) return toast.error('El correo es requerido.');
        if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres.');
        setCargando(true);
        try {
            await api.post('/usuarios', form);
            toast.success('Usuario creado correctamente.');
            onExito();
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo crear el usuario. Verifique los datos.');
        } finally { setCargando(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Nuevo Usuario</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Complete la información del nuevo usuario</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombre <span className="text-red-500">*</span></label>
                            <input type="text" value={form.nombre}
                                onChange={e => setForm({ ...form, nombre: e.target.value })}
                                placeholder="María" className="input" required />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Apellidos <span className="text-red-500">*</span></label>
                            <input type="text" value={form.apellidos}
                                onChange={e => setForm({ ...form, apellidos: e.target.value })}
                                placeholder="González Pérez" className="input" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo Electrónico <span className="text-red-500">*</span></label>
                        <input type="email" value={form.correo}
                            onChange={e => setForm({ ...form, correo: e.target.value })}
                            placeholder="usuario@flores.go.cr" className="input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input type={verPassNuevo ? 'text' : 'password'} value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres" className="input pr-10" required minLength={6} />
                            <button type="button" onClick={() => setVerPassNuevo(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {verPassNuevo ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol <span className="text-red-500">*</span></label>
                            <select value={form.rol}
                                onChange={e => setForm({ ...form, rol: e.target.value })}
                                className="input">
                                <option value="Usuario">Usuario</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Puesto</label>
                            <input type="text" value={form.puesto}
                                onChange={e => setForm({ ...form, puesto: e.target.value })}
                                placeholder="Secretaría Municipal" className="input" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" disabled={cargando} className="btn-primary disabled:opacity-60">
                            {cargando ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Usuarios;
