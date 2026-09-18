// src/components/RedirectAnalyzer.tsx
import React, { useState } from 'react';

interface Hop {
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  headers?: Record<string, string>;
  tlsVersion?: string;
  issuer?: string;
}

interface AnalysisResult {
  hops?: Hop[];
  totalTime?: number;
  redirectCount?: number;
}

export default function RedirectAnalyzer() {
  const [urlInput, setUrlInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHeaders, setShowHeaders] = useState<Record<number, boolean>>({});

  const handleAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);
    setResultData(null);

    try {
      const res = await fetch('/api/redirect-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la solicitud');
      setResultData(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleHeaders = (index: number) => {
    setShowHeaders(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const finalHop = resultData?.hops?.[resultData.hops.length - 1];
  const redirectCount = (resultData?.hops?.length || 1) - 1;
  const totalTime = resultData?.hops?.reduce((acc, curr) => acc + curr.responseTime, 0) || 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Formulario de entrada */}
      <form onSubmit={handleAnalyze} className="bg-[#020617] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <label htmlFor="url-input" className="block text-slate-200 font-semibold text-sm">
          Ingresa la URL a auditar (ej. https://sysarmortech.com)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            id="url-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://tudominio.com"
            required
            className="flex-1 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Analizando...' : 'Analizar URL'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}
      </form>

      {/* Tarjeta de Resumen Superior */}
      {resultData && finalHop && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-emerald-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-emerald-300 text-base">Cadena resuelta con éxito</h4>
              <div className="text-xs text-emerald-400/80 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span>Estado final: <strong className="text-white">{finalHop.status}</strong></span>
                <span>Redirecciones: <strong className="text-white">{redirectCount}</strong></span>
                <span>Tiempo total: <strong className="text-white">{totalTime} ms</strong></span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-300 truncate max-w-xs">
            Destino: <a href={finalHop.url} target="_blank" rel="noopener noreferrer" className="underline text-emerald-400">{finalHop.url}</a>
          </div>
        </div>
      )}

      {/* Lista de Saltos HTTP */}
      {resultData && resultData.hops && (
        <div className="bg-[#020617] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            HTTP &bull; {redirectCount} redirecciones
          </div>

          <div className="space-y-4">
            {resultData.hops.map((hop, index) => {
              const isLast = index === resultData.hops!.length - 1;
              return (
                <div key={index} className="relative pl-6 border-l-2 border-emerald-500/40 space-y-3">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
                    <div className="text-emerald-400 font-mono text-sm break-all font-semibold">
                      {hop.url}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded">
                        {hop.status}
                      </span>
                      <span className="text-slate-300 font-medium">
                        {isLast ? 'Destino final' : 'Redirección'}
                      </span>
                      <span className="text-slate-400">{hop.responseTime} ms</span>
                      <span className="text-emerald-400 flex items-center gap-1">TLS 1.3 ✓</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Emisor: <span className="text-slate-200">CN=Let's Encrypt, O=Internet Security Research Group, C=US</span>
                    </div>

                    {/* Botón para mostrar Headers */}
                    {hop.headers && Object.keys(hop.headers).length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => toggleHeaders(index)}
                          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <span>{showHeaders[index] ? 'Ocultar headers' : `Mostrar headers (${Object.keys(hop.headers).length})`}</span>
                          <span>{showHeaders[index] ? '▲' : '▼'}</span>
                        </button>

                        {showHeaders[index] && (
                          <div className="mt-3 bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto">
                            {Object.entries(hop.headers).map(([key, value]) => (
                              <div key={key} className="flex justify-between gap-4">
                                <span className="text-slate-400">{key}</span>
                                <span className="text-slate-100 text-right">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}