export function ProductVisual({ image, productId, finish, className, eager = false }) {
  const assets = import.meta.env.BASE_URL + "images/";

  if (image === "watch" || image === "powerbank") {
    const trail = productId === "tempo-trail";
    const color = finish?.hex ?? (image === "powerbank" ? "#587082" : trail ? "#cc7d43" : "#5c8777");
    return (
      <div className={className} aria-hidden="true">
        <span className="accessory-visual" data-device={image} data-trail={trail || undefined} style={{ "--device-finish": color }}>
          <span className="accessory-body"><span>{image === "powerbank" ? "100%" : trail ? "TRAIL" : "TEMPO"}</span></span>
        </span>
      </div>
    );
  }

  if (image === "flash") {
    const dual = productId === "shift-duo-128";
    const body = finish?.hex ?? "#858d9f";
    return (
      <svg className={className} viewBox="0 0 480 320" aria-hidden="true" style={{ display: "block" }}>
        <g transform="rotate(-17 240 160)">
          {dual ? <rect x="69" y="143" width="58" height="34" rx="12" fill="#c5cfdb" />
            : <rect x="64" y="135" width="52" height="49" rx="24" fill="none" stroke={body} strokeWidth="8" />}
          <rect x="296" y="132" width="87" height="56" rx="7" fill="#d0d9e5" />
          <path d="M350 143h12v8h-12zm0 24h12v8h-12z" fill="#252c37" />
          <rect x="99" y="117" width="226" height="86" rx="21" fill={body} stroke="#cdd4e1" strokeWidth="2" />
          <path d="M115 135q0-8 13-8h173" fill="none" stroke="#ffffff68" strokeWidth="2" />
          <text x="211" y="169" fill="#fff" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="17">
            {dual ? "SHIFT DUO · 128 GB" : "PULSE · 64 GB"}
          </text>
        </g>
      </svg>
    );
  }

  return (
    <picture className={className}>
      <source
        type="image/webp"
        srcSet={`${assets}${image}-future-480.webp 480w, ${assets}${image}-future-960.webp 960w`}
        sizes="(max-width: 640px) 90vw, (max-width: 900px) 45vw, 520px"
      />
      <img
        src={`${assets}${image}-960.svg`}
        alt=""
        loading={eager ? "eager" : "lazy"}
        width="960"
        height="960"
      />
    </picture>
  );
}
