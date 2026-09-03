// src/components/VlsmCalculator.tsx
// @ts-check
import CalculatorIPv4 from './CalculatorIPv4';

export default function VlsmCalculator() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-xl border border-slate-200">
      <CalculatorIPv4 />
    </div>
  );
}