---
// ... tu frontmatter (props) actual ...
---

<div class="my-10 p-6 bg-[#020617] border border-slate-800 rounded-2xl shadow-xl max-w-2xl mx-auto" id="feedback-widget">
  <!-- (Todo tu HTML de las manos, selector y tarjetas se queda igual) -->
  <div class="text-center mb-4">
    <h3 class="text-slate-100 font-semibold text-lg mb-3">¿Te resultó útil esta documentación?</h3>
    <div class="flex justify-center gap-4">
      <button type="button" id="btn-useful" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm cursor-pointer">👍 Útil</button>
      <button type="button" id="btn-not-useful" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm cursor-pointer">👎 No útil</button>
    </div>
  </div>

  <div id="reason-container" class="my-4 text-center">
    <label for="feedback-reason" class="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Motivo (Opcional):</label>
    <select id="feedback-reason" class="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 max-w-xs mx-auto block cursor-pointer">
      <option value="Explicación clara y directa">Explicación clara y directa</option>
      <option value="Código listo para producción">Código listo para producción</option>
      <option value="Solucionó mi problema técnico">Solucionó mi problema técnico</option>
      <option value="Otro">Otro motivo</option>
    </select>
  </div>

  <div id="lead-card" class="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-2xl transition-all mt-4" style="display: none;">
    <h4 class="text-amber-400 font-bold text-base mb-1">¡Excelente! Me alegra que te haya servido. 🚀</h4>
    <p class="text-slate-300 text-xs sm:text-sm mb-4">Ingresa tu correo para enviarte el PDF:</p>
    <form id="lead-pdf-form" class="flex flex-col sm:flex-row gap-3">
      <input type="email" id="lead-email" placeholder="tu_correo@empresa.com" class="flex-1 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-4 py-2.5 text-sm" required />
      <button type="submit" id="lead-btn-submit" class="bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm cursor-pointer">📥 ENVIARME EL PDF</button>
    </form>
    <div id="lead-status" class="mt-3 text-xs" style="display: none;"></div>
  </div>

  <div id="thanks-card" class="bg-slate-900 border border-slate-700/60 rounded-xl p-4 text-center mt-4" style="display: none;">
    <p class="text-slate-300 text-sm">Gracias por tu feedback. Trabajaremos para mejorar la documentación. 🛠️</p>
  </div>
</div>

<!-- Importación correcta de ES Modules en Astro -->
<script>
  import "../scripts/feedback.js";
</script>