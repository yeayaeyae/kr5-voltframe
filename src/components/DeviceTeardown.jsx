import { lazy, Suspense, useId, useRef, useState } from "react";
import { teardownParts } from "./teardownParts.js";

const TeardownViewer = lazy(() => import("./TeardownViewer.jsx"));

export default function DeviceTeardown({ product, finish, showcase = false, onBack }) {
  const [mode, setMode] = useState("exploded");
  const [selected, setSelected] = useState(0);
  const [focused, setFocused] = useState(null);
  const partButtons = useRef([]);
  const heading = useId();
  const components = teardownParts[product.image];
  const part = components[selected];
  const spec = product.features?.find(({ label }) => part.features.includes(label));
  const [label, value] = spec ? [spec.label, spec.value] : part.fact;

  function selectPart(index) {
    setSelected(index);
    setFocused(index);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setFocused(null);
  }

  function showOverview() {
    setFocused(null);
    partButtons.current[selected]?.focus({ preventScroll: true });
  }

  return (
    <section className="device-teardown" aria-labelledby={heading} onKeyDown={event => {
      if (event.key !== "Escape" || !onBack) return;
      event.preventDefault();
      event.stopPropagation();
      if (focused === null) onBack();
      else showOverview();
    }}>
      {onBack && <button className="teardown-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {showcase ? "К витрине" : "К внешнему виду"}
      </button>}
      <header className="teardown-header">
        <div>
          <p className="eyebrow">{showcase ? product.title : "Схема устройства"}</p>
          {showcase ? <h1 id={heading}>Крупный план</h1> : <h2 id={heading}>Крупный план</h2>}
        </div>
        <div className="teardown-modes" role="group" aria-label="Вид комплектующих">
          <button type="button" aria-pressed={mode === "exploded"} onClick={() => changeMode("exploded")}>Разборка</button>
          <button type="button" aria-pressed={mode === "inside"} onClick={() => changeMode("inside")}>Внутри</button>
        </div>
      </header>
      <Suspense fallback={<div className="teardown-viewport teardown-unavailable" role="status">Загружаем 3D-модель…</div>}>
        <TeardownViewer product={product} finish={finish} mode={mode} selected={selected} focused={focused}
          components={components} onSelect={selectPart} onOverview={showOverview} />
      </Suspense>
      <div className="teardown-parts" role="group" aria-label="Комплектующие устройства">
        {components.map(({ name }, index) => (
          <button type="button" key={name} ref={element => { partButtons.current[index] = element; }}
            aria-pressed={selected === index} onClick={() => selectPart(index)}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{name}
          </button>
        ))}
      </div>
      <div className="teardown-detail" aria-live="polite">
        <div><h3>{part.name}</h3><p>{part.detail}</p></div>
        <dl><dt>{label}</dt><dd>{value}</dd></dl>
      </div>
      {showcase && <p className="teardown-caption">Схема устройства</p>}
    </section>
  );
}
