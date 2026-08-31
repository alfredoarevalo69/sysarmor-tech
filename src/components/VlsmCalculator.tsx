// @ts-check
import { useState } from 'preact/hooks';
import CalculatorIPv4 from './CalculatorIPv4';
import CalculatorIPv6 from './CalculatorIPv6';

export default function VlsmCalculator() {
  const [activeTab, setActiveTab] = useState<'IPv4' | 'IPv6'>('IPv4');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
      <div className="flex border-b border-slate-200 mb-6 pb-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('IPv4')}
          className={`flex-1 py-3 text-center font-bold text-sm rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'IPv4'
              ? 'bg-[#D4AF37] text-neutral-950 shadow-sm' // Amarillo quemado / dorado corporativo con texto oscuro
              : 'bg-slate-100 text-neutral-600 hover:bg-slate-200'
          }`}
        >
          Calculadora VLSM (IPv4)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('IPv6')}
          className={`flex-1 py-3 text-center font-bold text-sm rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'IPv6'
              ? 'bg-teal-700 text-white shadow-sm' // Verde que ya te gustó para IPv6
              : 'bg-slate-100 text-neutral-600 hover:bg-slate-200'
          }`}
        >
          Calculadora Subredes (IPv6)
        </button>
      </div>

      {activeTab === 'IPv4' ? <CalculatorIPv4 /> : <CalculatorIPv6 />}
    </div>
  );
}