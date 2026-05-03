export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      {/* Icon group: pin + documento + chat bubble */}
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Documento/ticket (outline estilo logo) */}
        <rect x="21" y="6" width="14" height="17" rx="2" stroke="white" strokeOpacity="0.35" strokeWidth="1.3" fill="none"/>
        <line x1="24" y1="10.5" x2="32" y2="10.5" stroke="white" strokeOpacity="0.35" strokeWidth="1.3" strokeDasharray="2.5 1.5" strokeLinecap="round"/>
        <line x1="24" y1="14"   x2="30" y2="14"   stroke="white" strokeOpacity="0.35" strokeWidth="1.3" strokeDasharray="2.5 1.5" strokeLinecap="round"/>
        <line x1="24" y1="17.5" x2="31" y2="17.5" stroke="white" strokeOpacity="0.35" strokeWidth="1.3" strokeDasharray="2.5 1.5" strokeLinecap="round"/>

        {/* Chat bubble (outline) */}
        <rect x="22" y="25" width="13" height="9" rx="3" stroke="white" strokeOpacity="0.35" strokeWidth="1.3" fill="none"/>
        <circle cx="26" cy="29.5" r="1.1" fill="white" fillOpacity="0.5"/>
        <circle cx="28.5" cy="29.5" r="1.1" fill="white" fillOpacity="0.5"/>
        <circle cx="31" cy="29.5" r="1.1" fill="white" fillOpacity="0.5"/>

        {/* Pin de localização (sólido vermelho) */}
        <path
          d="M14 2C8.48 2 4 6.48 4 12C4 19.5 14 28 14 28C14 28 24 19.5 24 12C24 6.48 19.52 2 14 2Z"
          fill="#DC2626"
        />
        <circle cx="14" cy="12" r="4.2" fill="white" fillOpacity="0.95"/>
      </svg>

      {/* Separador + texto */}
      <div className="border-l border-white/20 pl-3">
        <p className="text-[13.5px] font-bold leading-snug tracking-tight text-white">
          Ponto da Tecnologia
        </p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200/60">
          Central de Chamados
        </p>
      </div>
    </div>
  );
}
