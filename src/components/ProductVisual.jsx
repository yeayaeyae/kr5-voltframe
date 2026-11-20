export function ProductVisual({ image, className, eager = false }) {
  const assets = import.meta.env.BASE_URL + "images/";

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
