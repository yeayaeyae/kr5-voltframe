const svgNamespace = "http://www.w3.org/2000/svg";
const deviceOutlines = {
  phone: "M10 2h12a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Z M13 6h6 M13 26h6",
  laptop: "M7 6h18v15H7z M7 21l-4 5h26l-4-5 M13 24h6",
  audio: "M5 18v-4a11 11 0 0 1 22 0v4 M5 16h4a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z M27 16h-4a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3z",
  flash: "M4 10h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z M21 12h9v8h-9 M25 15h1 M25 17h1 M6 16h7",
  watch: "M12 7V2h8v5m-8 18v5h8v-5M11 7h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4zm5 5v4l3 2",
  powerbank: "M9 3h14a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm3 5h8m-3 5-4 5h6l-4 5",
};

function visibleCartTarget() {
  return Array.from(document.querySelectorAll("[data-cart-flight-target]"))
    .find(element => element.getClientRects().length > 0);
}

function createIcon(device, color) {
  const icon = document.createElement("span");
  icon.className = "cart-flight-device";
  icon.setAttribute("aria-hidden", "true");
  if (color) icon.style.setProperty("--flight-finish", color);

  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  const outline = document.createElementNS(svgNamespace, "path");
  outline.setAttribute("d", deviceOutlines[device] ?? deviceOutlines.phone);
  svg.append(outline);
  icon.append(svg);
  return icon;
}

export function flyDeviceToCart(button, device, color) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = visibleCartTarget();
  if (!target || typeof button.animate !== "function") return;

  const source = button.getBoundingClientRect();
  const destination = target.getBoundingClientRect();
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height / 2;
  const endY = destination.top + destination.height / 2;
  const dx = destination.left + destination.width / 2 - startX;
  const dy = endY - startY;
  const lift = Math.min(136, Math.min(startY, endY) * .58 + Math.abs(dy) * .10);

  const icon = createIcon(device, color);
  icon.style.left = `${startX}px`;
  icon.style.top = `${startY}px`;
  document.body.append(icon);

  // Sample a quadratic arc. The final frame lands at the center of the live cart badge.
  const frames = Array.from({ length: 13 }, (_, index) => {
    const progress = index / 12;
    const height = -4 * lift * progress * (1 - progress);
    const scale = progress < .22 ? .87 + progress * .85 : 1.19 - progress * .93;
    return {
      transform: `translate(${dx * progress}px, ${dy * progress + height}px) translate(-50%, -50%) rotate(${-12 + 46 * progress}deg) scale(${scale})`,
      opacity: progress > .84 ? 1 - (progress - .84) / .16 : 1,
    };
  });
  const flight = icon.animate(frames, { duration: 640, easing: "cubic-bezier(.28,.05,.24,1)", fill: "forwards" });
  flight.finished.then(() => {
    icon.remove();
    visibleCartTarget()?.animate(
      [{ scale: "1" }, { scale: "1.26" }, { scale: "1" }],
      { duration: 290, easing: "ease-out" },
    );
  }, () => icon.remove());
}
