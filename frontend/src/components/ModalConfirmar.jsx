import { MdWarning, MdDeleteForever } from 'react-icons/md';

/**
 * Modal de confirmación reutilizable
 * Props:
 *   abierto       — boolean
 *   titulo        — string
 *   mensaje       — string
 *   detalle       — string (opcional, texto secundario más pequeño)
 *   tipo          — 'peligro' | 'advertencia' (default: peligro)
 *   textoCancelar — string (default: 'Cancelar')
 *   textoConfirmar— string (default: 'Eliminar')
 *   onCancelar    — función
 *   onConfirmar   — función
 *   cargando      — boolean
 */
const ModalConfirmar = ({
    abierto, titulo, mensaje, detalle, tipo = 'peligro',
    textoCancelar = 'Cancelar', textoConfirmar = 'Eliminar',
    onCancelar, onConfirmar, cargando = false
}) => {
    if (!abierto) return null;

    const esPeligro = tipo === 'peligro';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
                {/* Ícono */}
                <div className="flex justify-center pt-6 pb-2">
                    <div className={`p-4 rounded-full ${esPeligro ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {esPeligro
                            ? <MdDeleteForever size={32} className="text-red-600" />
                            : <MdWarning size={32} className="text-amber-600" />}
                    </div>
                </div>

                {/* Contenido */}
                <div className="px-6 pb-2 text-center">
                    <h2 className="text-lg font-bold text-slate-800 mt-2">{titulo}</h2>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">{mensaje}</p>
                    {detalle && (
                        <p className="text-slate-400 text-xs mt-2 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
                            {detalle}
                        </p>
                    )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 px-6 py-5">
                    <button onClick={onCancelar} disabled={cargando}
                        className="flex-1 btn-secondary justify-center py-2.5 disabled:opacity-60">
                        {textoCancelar}
                    </button>
                    <button onClick={onConfirmar} disabled={cargando}
                        className={`flex-1 justify-center py-2.5 font-semibold rounded-xl text-sm text-white transition-all duration-200 disabled:opacity-60
                            ${esPeligro ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                        {cargando ? 'Procesando...' : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmar;
