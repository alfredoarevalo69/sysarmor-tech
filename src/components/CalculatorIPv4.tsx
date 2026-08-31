// @ts-check
import { useState } from 'preact/hooks';
import { calculateIPv4Subnets, type CalculatedIPv4Subnet, type IPv4Requirement } from '../utils/ipv4Engine';

export default function CalculatorIPv4() {
  const [step, setStep] = useState<number>(1);
  const [baseIp, setBaseIp] = useState('192.168.1.0/24');
  const [requirements, setRequirements] = useState<IPv4Requirement[]>([]);
  const [netName, setNetName] = useState('');
  const [hosts, setHosts] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CalculatedIPv4Subnet[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAddRequirement = () => {
    setError(null);
    if (!netName.trim() || !hosts) {
      setError('Ingresa el nombre del área y la cantidad de hosts estimados.');
      return;
    }
    const parsedHosts = parseInt(hosts, 10);
    if (isNaN(parsedHosts) || parsedHosts <= 0) {
      setError('El número de hosts debe ser mayor a 0.');
      return;
    }

    setRequirements((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), name: netName.trim(), hostsNeeded: parsedHosts },
    ]);
    setNetName('');
    setHosts('30');
  };

  const handleRemove = (id: string) => {
    setRequirements((prev) => prev.filter((req) => req.id !== id));
  };

  const handleNextStep = () => {
    if (!baseIp.includes('/')) {
      setError('La red base debe incluir notación CIDR (ej: 192.168.1.0/24).');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleExecuteCalculation = () => {
    setError(null);
    if (!baseIp.includes('/')) {
      setError('La red base debe incluir notación CIDR (ej: 192.168.1.0/24).');
      return;
    }
    if (requirements.length === 0) {
      setError('Debes registrar al menos una subred.');
      return;
    }
    try {
      const res = calculateIPv4Subnets(baseIp, requirements);
      setResults(res);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Error al calcular las subredes IPv4.');
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Indicador de Pasos del Asistente */}
      <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-300 text-xs font-bold text-neutral-700">
        <span className={`px-3 py-1 rounded-lg ${step === 1 ? 'bg-neutral-900 text-white' : 'text-slate-500'}`}>
          Paso 1: Red Base
        </span>
        <span className={`px-3 py-1 rounded-lg ${step === 2 ? 'bg-neutral-900 text-white' : 'text-slate-500'}`}>
          Paso 2: Subredes
        </span>
        <span className={`px-3 py-1 rounded-lg ${step === 3 ? 'bg-emerald-700 text-white' : 'text-slate-500'}`}>
          Paso 3: Resultados
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {/* PASO 1: Configurar Red Base */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-300 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Asistente IPv4 - Red Principal</h3>
            <p className="text-xs text-slate-600">
              Define la dirección de red troncal que deseas fragmentar mediante VLSM.
            </p>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-700">Bloque IPv4 CIDR Base</label>
              <input
                type="text"
                value={baseIp}
                onInput={(e: any) => setBaseIp(e.currentTarget.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Ej: 192.168.0.0/16"
              />
            </div>
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-colors"
            >
              Siguiente: Agregar Requerimientos &rarr;
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Documentación y Teoría VLSM</h4>
            <p className="text-xs text-slate-600">
              Consulta el artículo completo en el blog técnico para repasar los fundamentos del cálculo de subredes IPv4.
            </p>
            <a
              href="https://sysarmortech.com/blog/manual-subnetting-ipv4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-neutral-900 font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
            >
              <span>🌐 Leer Manual Subnetting IPv4 (Blog)</span>
            </a>
          </div>
        </div>
      )}

      {/* PASO 2: Agregar Subredes */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-300 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Añadir Subred o Departamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Nombre de la Red</label>
                <input
                  type="text"
                  value={netName}
                  onInput={(e: any) => setNetName(e.currentTarget.value)}
                  placeholder="Ej: VLAN-Gerencia"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Hosts Máximos Necesarios</label>
                <input
                  type="number"
                  min="1"
                  value={hosts}
                  onInput={(e: any) => setHosts(e.currentTarget.value)}
                  placeholder="Ej: 25"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddRequirement}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 rounded-lg text-sm cursor-pointer transition-colors"
            >
              Añadir a la lista VLSM
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">Subredes Planificadas ({requirements.length})</h4>
            {requirements.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay subredes configuradas en este asistente.</p>
            ) : (
              requirements.map((req) => (
                <div key={req.id} className="flex justify-between items-center bg-white border border-slate-200 px-4 py-3 rounded-lg shadow-sm">
                  <span className="font-mono text-sm">
                    <strong className="text-neutral-900">{req.name}</strong> <span className="text-slate-500">({req.hostsNeeded} hosts requeridos)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(req.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold px-2.5 py-1 bg-red-50 rounded cursor-pointer transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 bg-slate-200 hover:bg-slate-300 text-neutral-800 font-bold py-3 rounded-xl text-sm cursor-pointer transition-colors"
            >
              &larr; Volver
            </button>
            {requirements.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteCalculation}
                className="w-2/3 bg-[#C59B27] hover:bg-[#b08922] text-neutral-900 font-bold py-3 rounded-xl text-sm cursor-pointer shadow-md transition-colors"
              >
                Calcular Distribución IPv4 VLSM
              </button>
            )}
          </div>
        </div>
      )}

      {/* PASO 3: Resultados */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-sm text-emerald-900 flex justify-between items-center">
            <h4 className="font-bold">Cálculo IPv4 Exitoso</h4>
            <span className="text-xs font-semibold">{results.length} subredes generadas</span>
          </div>

          {results.map((res, i) => (
            <div key={i} className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex justify-between items-center">
                <span className="font-bold text-sm text-neutral-900">Subred: {res.name}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`${res.networkAddress}${res.cidr}`, i)}
                  className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-neutral-800 font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
                >
                  {copiedIndex === i ? '¡Copiado!' : 'Copiar CIDR'}
                </button>
              </div>
              <table className="w-full text-left border-collapse text-xs font-mono">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 font-semibold text-right text-neutral-800 bg-slate-100 border-r border-slate-300 w-1/3">Network CIDR:</td>
                    <td className="p-3 text-neutral-900">{res.networkAddress}{res.cidr}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 font-semibold text-right text-neutral-800 bg-slate-100 border-r border-slate-300">Subnet Mask:</td>
                    <td className="p-3 text-neutral-900">{res.subnetMask}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 font-semibold text-right text-neutral-800 bg-slate-100 border-r border-slate-300">Usable Range:</td>
                    <td className="p-3 text-neutral-900 break-all">{res.usableRange}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-3 font-semibold text-right text-neutral-800 bg-slate-100 border-r border-slate-300">Broadcast:</td>
                    <td className="p-3 text-neutral-900">{res.broadcastAddress}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-right text-neutral-800 bg-slate-100 border-r border-slate-300">Hosts (Req/Alloc):</td>
                    <td className="p-3 text-neutral-900">{res.hostsRequested} / {res.hostsAllocated}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setRequirements([]);
            }}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl text-sm cursor-pointer transition-colors"
          >
            Reiniciar Asistente IPv4
          </button>
        </div>
      )}
    </div>
  );
}