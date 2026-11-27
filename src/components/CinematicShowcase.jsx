import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { edition } from "../editions.js";
import { money } from "../hooks.js";
import { ProductVisual } from "./ProductVisual.jsx";
import DeviceTeardown from "./DeviceTeardown.jsx";

const DeviceViewer = lazy(() => import("./DeviceViewer.jsx"));
const exitDuration = 290;
const enterDuration = 1050;
const previewDuration = 5200;
const chapters = [
  { id: "showroom", label: "Витрина" },
  { id: "collection", label: "Коллекция" },
  { id: "teardown", label: "Детали" },
  { id: "specs", label: "Характеристики" },
  { id: "outro", label: "Финал" },
];
const sceneArt = import.meta.env.BASE_URL + "images/voltframe-showroom.webp";
const scenes = [
  {
    id: "prism-x1", image: "phone", type: "Смартфон", selector: "Смартфон",
    title: "Prism X1", wordmark: "PRISM", accent: "#c6ff3d", glow: "#9ed823",
    description: "Титановый корпус, полупрозрачная кромка и OLED-экран на 120 Гц.",
  },
  {
    id: "orbit-14", image: "laptop", type: "Ноутбук", selector: "Ноутбук",
    title: "Orbit 14", wordmark: "ORBIT", accent: "#80e7ff", glow: "#248ba4",
    description: "Компактный ноутбук с 14-дюймовым OLED-дисплеем и 32 ГБ памяти.",
  },
  {
    id: "echo-neon", image: "audio", type: "Наушники", selector: "Наушники",
    title: "Echo Neon", wordmark: "ECHO", accent: "#eeadff", glow: "#a24ac7",
    description: "Беспроводные наушники с активным шумоподавлением и автономностью до 44 часов.",
  },
  {
    id: "shift-duo-128", image: "flash", type: "Флешка", selector: "Флешки",
    title: "Shift Duo 128", wordmark: "SHIFT", accent: "#ffce85", glow: "#b9793a",
    description: "128 ГБ памяти и два разъёма: USB-A для компьютера и USB-C для совместимых устройств.",
  },
  {
    id: "tempo-trail", image: "watch", type: "Смарт-часы", selector: "Часы",
    title: "Tempo Trail", wordmark: "TEMPO", accent: "#ffa878", glow: "#bd6336",
    description: "Часы для походов с AMOLED-дисплеем, двухчастотным GPS и физическими кнопками.",
  },
  {
    id: "flux-20", image: "powerbank", type: "Пауэрбанк", selector: "Пауэрбанки",
    title: "Flux 20", wordmark: "FLUX", accent: "#84eeda", glow: "#339991",
    description: "20 000 мА·ч, два USB-C и зарядка мощностью до 45 Вт.",
  },
];

const initialScene = scenes.findIndex(item => item.id === edition.featured);

export function CinematicShowcase({ products }) {
  const [view, setView] = useState(() => ({
    active: initialScene, chapter: 0, next: null, direction: 1, featured: false,
    phase: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "idle" : "intro",
  }));
  const [playing, setPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [hotspot, setHotspot] = useState(0);
  const selectors = useRef([]);
  const stage = useRef(null);
  const swipeOrigin = useRef(null);
  const scene = scenes[view.active];
  const product = products.find(item => item.id === scene.id);
  const chapter = chapters[view.chapter];
  const showroom = chapter.id === "showroom";
  const collection = chapter.id === "collection";
  const teardown = chapter.id === "teardown";
  const collectionScenes = [0, 1, 2].map(offset => scenes[(view.active + offset) % scenes.length]);
  const specs = product?.features.slice(0, 3) ?? [];
  const busy = view.phase !== "idle";

  useEffect(() => {
    if (view.phase === "idle") return;
    const timer = window.setTimeout(() => {
      setView(current => current.phase === "leaving"
        ? { ...current, ...current.next, next: null, phase: "entering" }
        : { ...current, phase: "idle" });
    }, view.phase === "leaving" ? exitDuration : enterDuration);
    return () => window.clearTimeout(timer);
  }, [view.phase, view.chapter]);

  function moveTo(active, chapter, featured = false, allowEntering = false) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setView(current => {
      if (current.phase !== "idle" && !(allowEntering && current.phase === "entering")) return current;
      if (current.chapter === 0 && chapter === 0 && current.active === active) return { ...current, featured };
      if (current.active === active && current.chapter === chapter) return current;
      const direction = Math.sign(active === current.active ? chapter - current.chapter : active - current.active);
      return reducedMotion
        ? { active, chapter, featured, next: null, phase: "idle", direction }
        : { ...current, next: { active, chapter, featured }, phase: "leaving", direction };
    });
    if (view.phase === "idle") setHotspot(0);
  }

  function select(index) {
    moveTo(index, 0, true);
  }

  function returnToShowroom() {
    stage.current.focus({ preventScroll: true });
    moveTo(view.active, 0, true, true);
  }

  useEffect(() => {
    if (!playing || !showroom || busy || view.featured) return;
    const timer = window.setInterval(() => {
      if (document.hidden || document.activeElement?.classList.contains("showroom-device")) return;
      setView(current => current.phase !== "idle" || current.chapter !== 0 || current.featured ? current : ({
        ...current,
        next: { active: (current.active + 1) % scenes.length, chapter: 0, featured: false },
        direction: 1,
        phase: "leaving",
      }));
    }, previewDuration);
    return () => window.clearInterval(timer);
  }, [playing, showroom, busy, view.featured, view.active]);

  function step(direction) {
    const next = view.chapter + direction;
    if (busy || next < 0 || next >= chapters.length) return false;
    moveTo(view.active, next);
    return true;
  }

  const wheel = useRef({ last: 0, amount: 0, used: false });
  useEffect(() => {
    const element = stage.current;
    function onWheel(event) {
      if (event.ctrlKey || event.target.closest(".device-teardown") || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const gesture = wheel.current;
      if (event.timeStamp - gesture.last > 180) {
        gesture.amount = 0;
        gesture.used = false;
      }
      gesture.last = event.timeStamp;
      const direction = Math.sign(event.deltaY);
      const next = view.chapter + direction;
      if (busy || gesture.used) {
        event.preventDefault();
        return;
      }
      if (next < 0 || next >= chapters.length) return;
      event.preventDefault();
      gesture.amount += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      if (Math.abs(gesture.amount) < 44) return;
      gesture.used = true;
      moveTo(view.active, next);
    }
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [view.active, view.chapter, view.phase]);

  function handleStageKey(event) {
    if (showroom && view.featured && event.key === "Escape") {
      event.preventDefault();
      moveTo(view.active, 0);
      return;
    }
    const previous = event.key === "PageUp" || event.key === "ArrowUp";
    const next = event.key === "PageDown" || event.key === "ArrowDown"
      || (event.key === " " && event.target === event.currentTarget);
    if ((previous || next) && (busy || step(previous ? -1 : 1))) event.preventDefault();
  }

  function finishSwipe(event) {
    const touch = event.changedTouches[0];
    const start = swipeOrigin.current;
    swipeOrigin.current = null;
    if (!touch || !start) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx) * 1.25) step(dy < 0 ? 1 : -1);
  }
  function navigateSelection(event, index) {
    const offsets = { ArrowLeft: -1, ArrowRight: 1 };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    if (busy) return;
    const target = (index + offsets[event.key] + scenes.length) % scenes.length;
    selectors.current[target]?.focus();
    select(target);
  }

  return (
    <section className="cinematic" aria-label="Интерактивная витрина"
      style={{
        "--scene-accent": scene.accent, "--scene-glow": scene.glow,
        "--scene-direction": view.direction, "--scene-exit": `${exitDuration}ms`,
        "--scene-enter": `${enterDuration}ms`,
      }}
    >
      <div className="cinematic-inner">
        <div ref={stage} className="cinematic-stage" data-phase={view.phase} data-device={scene.image}
          data-chapter={chapter.id} data-next-chapter={view.next ? chapters[view.next.chapter].id : undefined}
          data-featured={view.featured || undefined}
          data-teardown={teardown || undefined}
          tabIndex={0} aria-label={chapter.label} onKeyDown={handleStageKey}
          onTouchStart={event => {
            const touch = event.touches[0];
            swipeOrigin.current = event.touches.length === 1 && !event.target.closest(".device-teardown")
              ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchCancel={() => { swipeOrigin.current = null; }} onTouchEnd={finishSwipe}
        >
          <div className="showroom-camera" aria-hidden="true">
            <div className="showroom-perspective">
              <img className="showroom-photo" src={sceneArt} alt="" fetchPriority="high" />
            </div>
          </div>
          {teardown && <DeviceTeardown key={scene.id} product={product ?? scene} showcase onBack={returnToShowroom} />}
          {showroom && <div className="cinematic-wordmark" aria-hidden="true" key={`wordmark-${scene.id}`}>
            {[...scene.wordmark].map((letter, index) => <span key={index} style={{ "--letter": index }}>{letter}</span>)}
          </div>}
          {showroom && <div className="showroom-devices">
            <div className="showroom-preview">
              <Suspense fallback={<ProductVisual image={scene.image} productId={scene.id} className="featured-fallback" eager />}>
                <DeviceViewer key={scene.id} product={product ?? scene} showroom interactive={view.featured}
                  autoSpin={playing && !view.featured} />
              </Suspense>
            </div>
            {!view.featured && <button className="showroom-device" type="button"
              aria-label={`Приблизить ${scene.title}`} disabled={busy} onClick={() => {
                stage.current.focus({ preventScroll: true });
                select(view.active);
              }} />}
          </div>}
          {showroom && <div className="cinematic-copy" key={`copy-${scene.id}`}>
            <p className="cinematic-type"><span aria-hidden="true" />{scene.type}</p>
            <h1><span>{scene.title}</span></h1>
            <p className="cinematic-description">{scene.description}</p>
            <div className="showroom-actions">
              <button className="cinematic-cta" type="button" aria-disabled={busy || undefined} onClick={() => {
                if (busy) return;
                stage.current.focus({ preventScroll: true });
                moveTo(view.active, view.featured ? 2 : 1);
              }}>
                {view.featured ? "Рассмотреть детали" : "Смотреть коллекцию"} <span aria-hidden="true">↓</span>
              </button>
              {view.featured && <>
                <Link className="cinematic-catalog" to={`/catalog/${scene.id}`} viewTransition>
                  Открыть товар <span aria-hidden="true">↗</span>
                </Link>
                <button className="showroom-reset" type="button" onClick={() => {
                  stage.current.focus({ preventScroll: true });
                  moveTo(view.active, 0);
                }}>← Вся витрина</button>
              </>}
            </div>
          </div>}
          {showroom && view.featured && product?.features && (
            <dl className="cinematic-specs">
              {product.features.slice(0, 2).map(({ label, value }) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          )}
          {collection && (
            <div className="scene-collection">
              <header className="collection-intro">
                <h1><span>Коллекция</span></h1>
                <p>Выберите модель, чтобы рассмотреть её в 3D.</p>
                <Link className="cinematic-catalog" to="/catalog" viewTransition>
                  Весь каталог <span aria-hidden="true">↗</span>
                </Link>
              </header>
              <div className="collection-grid">
                {collectionScenes.map((item, index) => {
                  const featured = products.find(entry => entry.id === item.id);
                  const preview = <ProductVisual image={item.image} productId={item.id} finish={featured?.colors?.[0]}
                    className="collection-render" eager />;
                  return (
                    <Link key={item.id} to={`/catalog/${item.id}`} className="collection-card"
                      style={{ "--card-order": index, "--card-glow": item.glow }} viewTransition>
                      <div className="collection-card-art">
                        {["flash", "watch", "powerbank"].includes(item.image) ? (
                          <Suspense fallback={preview}>
                            <div className="collection-render collection-model">
                              <DeviceViewer product={featured ?? item} interactive={false} />
                            </div>
                          </Suspense>
                        ) : preview}
                      </div>
                      <div className="collection-caption">
                        <div>
                          <span className="collection-type">{item.type}</span>
                          <h2>{item.title}</h2>
                          {featured && <span className="collection-price">{money(featured.price)}</span>}
                        </div>
                        <span className="collection-arrow" aria-hidden="true">↗</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          {chapter.id === "specs" && (
            <div className="scene-facts">
              <p className="eyebrow">{scene.title}</p>
              <h1>Характеристики</h1>
              <div className="scene-morph" role="group" aria-label="Параметры устройства">
                {specs.map(({ label }, index) => (
                  <button key={label} type="button" aria-pressed={hotspot === index} onClick={() => setHotspot(index)}>
                    {label}
                  </button>
                ))}
              </div>
              {specs[hotspot] && (
                <dl className="scene-selected-spec" aria-live="polite">
                  <dt>{specs[hotspot].label}</dt><dd key={specs[hotspot].label}>{specs[hotspot].value}</dd>
                </dl>
              )}
              <Link className="cinematic-cta" to={`/catalog/${scene.id}`} viewTransition>
                Открыть товар <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
          {chapter.id === "outro" && (
            <div className="scene-outro">
              <div className="scene-slices" aria-hidden="true">
                {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--slice": Math.abs(index - 4.5) }} />)}
              </div>
              <span className="outro-mark" aria-hidden="true">VF</span>
              <h1>{scene.title}</h1>
              <Link className="cinematic-cta" to={`/catalog/${scene.id}`} viewTransition>
                Открыть товар <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </div>
        <div className="cinematic-console">
          <div className="showroom-controls">
            <span className="cinematic-count" aria-hidden="true">0{view.active + 1} <span>/</span> 0{scenes.length}</span>
            {showroom && <button className="showroom-play" type="button"
              aria-label={playing ? "Приостановить автопоказ" : "Запустить автопоказ"}
              onClick={() => setPlaying(value => !value)}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button>}
          </div>
          <div className="cinematic-selector" role="group" aria-label="Выбрать технику">
            {scenes.map((item, index) => (
              <button key={item.id} ref={element => { selectors.current[index] = element; }} type="button"
                aria-pressed={index === view.active && (!showroom || view.featured)} aria-disabled={busy || undefined}
                onClick={() => select(index)} onKeyDown={event => navigateSelection(event, index)}>
                <span aria-hidden="true">0{index + 1}</span>{item.selector}
              </button>
            ))}
          </div>
          <Link className="cinematic-catalog" to="/catalog" viewTransition>Каталог <span aria-hidden="true">↗</span></Link>
        </div>
        <nav className="scene-pagination" aria-label="Сцены устройства">
          {chapters.map((item, index) => (
            <button key={item.id} type="button" aria-current={view.chapter === index ? "step" : undefined}
              aria-disabled={busy || undefined} onClick={() => moveTo(view.active, index)}>
              <span aria-hidden="true" />{item.label}
            </button>
          ))}
        </nav>
      </div>
      <span className="visually-hidden" role="status" aria-live={playing && showroom && !view.featured ? "off" : "polite"}>
        {scene.title} · {chapter.label}
      </span>
    </section>
  );
}
