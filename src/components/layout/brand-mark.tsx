export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document/ticket icon */}
        <rect x="20" y="5" width="15" height="17" rx="2" fill="white" fillOpacity="0.13" />
        <line x1="23" y1="9.5"  x2="32" y2="9.5"  stroke="white" strokeOpacity="0.45" strokeWidth="1.4" strokeDasharray="2.5 1.5" strokeLinecap="round"/>
        <line x1="23" y1="13"   x2="30" y2="13"    stroke="white" strokeOpacity="0.45" strokeWidth="1.4" strokeDasharray="2.5 1.5" strokeLinecap="round"/>
        <line x1="23" y1="16.5" x2="31" y2="16.5"  stroke="white" strokeOpacity="0.45" strokeWidth="1.4" strokeDasharray="2.5 1.5" strokeLinecap="round"/>

        {/* Chat bubble */}
        <rect x="20" y="24" width="15" height="9" rx="3" fill="white" fillOpacity="0.13" />
        <circle cx="24.5" cy="28.5" r="1.2" fill="white" fillOpacity="0.6" />
        <circle cx="27.5" cy="28.5" r="1.2" fill="white" fillOpacity="0.6" />
        <circle cx="30.5" cy="28.5" r="1.2" fill="white" fillOpacity="0.6" />

        {/* Map pin */}
        <path
          d="M12 2C7.03 2 3 6.03 3 11C3 17.75 12 27 12 27C12 27 21 17.75 21 11C21 6.03 16.97 2 12 2Z"
          fill="#DC2626"
        />
        <circle cx="12" cy="11" r="4" fill="white" fillOpacity="0.92" />
      </svg>

      <div className="border-l border-slate-700 pl-3">
        <p className="text-[13px] font-bold leading-tight text-white">Ponto da Tecnologia</p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Central de Chamados
        </p>
      </div>
    </div>
  );
}
