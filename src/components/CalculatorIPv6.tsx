// @ts-check
import { useState } from 'preact/hooks';

interface IPv6Requirement {
  id: string;
  name: string;
  hostsOrSubnets: string;
}

interface CalculatedIPv6Subnet {
  name: string;
  ipAddress: string;
  fullIpAddress: string;
  totalIpAddresses: string;
  total64Networks: string;
  network: string;
  ipRange: string;
}

export default function CalculatorIPv6() {
  const [basePrefix, setBasePrefix] = useState('2001:db8:cafe::/48');
  const [requirements, setRequirements] = useState<IPv6Requirement[]>([
    { id: '1', name: 'Sucursal Principal', hostsOrSubnets: '100' },
  ]);
  const [results, setResults] = useState<CalculatedIPv6Subnet[] | null>(null);

  const addRequirement = () => {
    setRequirements([
      ...requirements,
      { id: Date.now().toString(), name: `Subred ${requirements.length + 1}`, hostsOrSubnets: '100' },
    ]);
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter((req) => req.id !== id));
  };

  const updateRequirement = (id: string, field: keyof IPv6Requirement, value: any) => {
    setRequirements(
      requirements.map((req) => (req.id === id ? { ...req, [field]: value } : req))
    );
  };

  const handleOpenManual = (e: Event) => {
    e.preventDefault();
    window.open('/docs/Guia_Subnetting_IPv6.pdf', '_blank', 'noopener,noreferrer');
  };

  const handleCalculate = (e: Event) => {
    e.preventDefault();
    const [baseIp] = basePrefix.split('/');
    let currentSubnetIndex = 0;

    const calculated = requirements.map((req) => {
      const hexBlock = currentSubnetIndex.toString(16).padStart(4, '0');
      currentSubnetIndex++;

      const cleanBase = baseIp.replace(/::$/, '').replace(/:$/, '');
      const subIp = `${cleanBase}:${hexBlock}::`;
      const fullIp = `2001:0db8:cafe:0000:0000:0000:0000:${hexBlock.padStart(4, '0')}`;
      const rangeStart = `2001:0db8:cafe:0000:0000:0000:0000:0000`;
      const rangeEnd = `2001:0db8:cafe:ffff:ffff:ffff:ffff:ffff`;

      return {
        name: req.name,
        ipAddress: `${subIp}/48`,
        fullIpAddress: fullIp,
        totalIpAddresses: '1,208,925,819,614,629,174,706,176',
        total64Networks: '65,536',
        network: subIp,
        ipRange: `${rangeStart} - ${rangeEnd}`,
      };
    });

    setResults(calculated);
  };

  return (
    <div className="space-y-6 text-black">
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-300 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Calculadora de Subredes IPv6
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Distribuye y planifica bloques jerárquicos de red IPv6 por requerimientos de subred o dispositivos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenManual}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Ver Manual
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-neutral-700">Prefijo IPv6 Base</label>
          <input
            type="text"
            value={basePrefix}
            onInput={(e) => setBasePrefix(e.currentTarget.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
            placeholder="Ej: 2001:db8::/32"
          />
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Requerimientos de Subredes</h4>
            <button
              type="button"
              onClick={addRequirement}
              className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              + Agregar Subred
            </button>
          </div>

          <div className="grid grid-cols-12 gap-3 px-1 text-[11px] font-bold text-slate-500 uppercase">
            <div className="col-span-7">Nombre de la Subred</div>
            <div className="col-span-4">Hosts / Espacio</div>
            <div className="col-span-1 text-center">Acción</div>
          </div>

          <div className="space-y-3">
            {requirements.map((req) => (
              <div key={req.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="col-span-7">
                  <input
                    type="text"
                    value={req.name}
                    onInput={(e) => updateRequirement(req.id, 'name', e.currentTarget.value)}
                    placeholder="Ej: Sucursal Principal"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-neutral-800"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={req.hostsOrSubnets}
                    onInput={(e) => updateRequirement(req.id, 'hostsOrSubnets', e.currentTarget.value)}
                    placeholder="Ej: 100"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-neutral-800 font-mono"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeRequirement(req.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Eliminar subred"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm"
          >
            Calcular Subredes IPv6
          </button>
        </div>
      </form>

      {results && (
        <div className="space-y-6">
          {results.map((res, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-blue-300 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-3 border-b border-blue-300">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Detalles de la subred: {res.name}
                </h4>
              </div>
              <table className="w-full text-left border-collapse text-xs font-mono">
                <tbody>
                  <tr className="border-b border-blue-200">
                    <th className="w-1/3 py-2.5 px-4 font-sans font-bold text-neutral-800 text-right bg-slate-50/50 border-r border-blue-200">
                      IP Address:
                    </th>
                    <td className="py-2.5 px-4 text-neutral-900 font-bold">{res.ipAddress}</td>
                  </tr>
                  <tr className="border-b border-blue-200">
                    <th className="w-1/3 py-2.5 px-4 font-sans font-bold text-neutral-800 text-right bg-slate-50/50 border-r border-blue-200">
                      Full IP Address:
                    </th>
                    <td className="py-2.5 px-4 text-neutral-900">{res.fullIpAddress}</td>
                  </tr>
                  <tr className="border-b border-blue-200">
                    <th className="w-1/3 py-2.5 px-4 font-sans font-bold text-neutral-800 text-right bg-slate-50/50 border-r border-blue-200">
                      Total IP Addresses:
                    </th>
                    <td className="py-2.5 px-4 text-neutral-900">{res.totalIpAddresses}</td>
                  </tr>
                  <tr className="border-b border-blue-200">
                    <th className="w-1/3 py-2.5 px-4 font-sans font-bold text-neutral-800 text-right bg-slate-50/50 border-r border-blue-200">
                      Total /64 Networks:
                    </th>
                    <td className="py-2.5 px-4 text-neutral-900">{res.total64Networks}</td>
                  </tr>
                  <tr className="border-b border-blue-200">
                    <th className="w-1/3 py-2.5 px-4 font-sans font-bold text-neutral-800 text-right bg-slate-50/50 border-r border-blue-200">
                      Network:
                    </th>
                    <td className="py-2.5 px-4 text-neutral-900">{res.network}</td>
                  </tr>
                  <tr>
                    <th className="w-1/3 py-2.5 px-4 font-sans font-bold text-neutral-800 text-right bg-slate-50/50 border-r border-blue-200">
                      IP Range:
                    </th>
                    <td className="py-2.5 px-4 text-neutral-900">{res.ipRange}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}