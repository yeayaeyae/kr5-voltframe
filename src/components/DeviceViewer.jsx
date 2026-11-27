import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createDevice, getStudioMap } from "./deviceModels.js";
import { ProductVisual } from "./ProductVisual.jsx";
import { productColor } from "../productOptions.js";

export default function DeviceViewer({ product, finish, controls = false, interactive = true, reveal = 0, showroom = false, autoSpin = false }) {
  const host = useRef(null);
  const clock = useRef(null);
  const sceneApi = useRef(null);
  const drag = useRef(null);
  const revealDirection = useRef(reveal);
  const [ready, setReady] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { id, image } = product;
  const defaultFinish = productColor(product)?.hex;
  const selectedFinish = finish?.hex ?? defaultFinish;

  useEffect(() => {
    const element = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.append(renderer.domElement);

    const scene = new THREE.Scene();
    scene.environment = getStudioMap();
    scene.environmentIntensity = 1.13;
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    const rig = new THREE.Group();
    rig.add(createDevice({ id, image, color: defaultFinish }));
    const finishMaterials = new Set();
    let updateClock;
    rig.traverse(part => {
      if (!part.isMesh) return;
      if (part.material.userData.productFinish) finishMaterials.add(part.material);
      if (part.material.userData.updateClock) updateClock = part.material.userData.updateClock;
    });
    scene.add(rig, new THREE.HemisphereLight(0xf2f1ff, 0x283441, 1.42));
    const key = new THREE.DirectionalLight(showroom ? 0xffe1be : 0xfff5e8, 3.1);
    key.position.set(3, 5, 6);
    const fill = new THREE.DirectionalLight(0x92caff, 2.4);
    fill.position.set(-4, 1, -3);
    const rim = new THREE.DirectionalLight(showroom ? 0xffa062 : 0xffffff, showroom ? 2.4 : 1.6);
    if (showroom) rim.position.set(3, 2, -4);
    else rim.position.set(0, -1, 4);
    scene.add(key, fill, rim);

    const initialYaw = image === "phone" ? -.43 : -.57;
    const initialPitch = image === "laptop" ? .32 : image === "flash" ? .29 : .13;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    rig.rotation.set(initialPitch, initialYaw, image === "phone" ? -.1 : 0);
    const entrance = reducedMotion.matches ? 0 : revealDirection.current;
    let entranceStart = null;
    let shownYaw = initialYaw;
    let yaw = initialYaw;
    let pitch = initialPitch;
    let frame = 0;
    let spinning = false;
    let earlier = null;

    function render(time) {
      frame = 0;
      if (entranceStart === null) entranceStart = time;
      const entranceProgress = entrance && !reducedMotion.matches
        ? Math.min(1, (time - entranceStart) / 720)
        : 1;
      const moving = spinning && !reducedMotion.matches;
      if (moving && earlier !== null) yaw += Math.min(time - earlier, 50) * (showroom ? .00125 : .0006);
      earlier = moving ? time : null;
      const factor = reducedMotion.matches ? 1 : .19;
      rig.rotation.x += (pitch - rig.rotation.x) * factor;
      shownYaw += (yaw - shownYaw) * factor;
      rig.rotation.y = shownYaw + entrance * 1.4 * (1 - entranceProgress) ** 3;
      renderer.render(scene, camera);
      if (moving || entranceProgress < 1 || Math.abs(yaw - shownYaw) + Math.abs(pitch - rig.rotation.x) > .002) schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    let clockTimer;
    function tickClock() {
      if (document.hidden) return;
      const now = new Date();
      const time = updateClock(now);
      if (clock.current) {
        clock.current.textContent = time;
        clock.current.dateTime = time;
      }
      schedule();
      clockTimer = window.setTimeout(tickClock, 1000 - now.getMilliseconds());
    }

    function syncClockVisibility() {
      window.clearTimeout(clockTimer);
      tickClock();
    }

    if (updateClock) {
      document.addEventListener("visibilitychange", syncClockVisibility);
      tickClock();
    }

    function resize() {
      const { clientWidth: width, clientHeight: height } = element;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.set(0, 0, (image === "laptop" ? 5.7 : 5.2) * Math.max(1, 1 / camera.aspect));
      camera.updateProjectionMatrix();
      schedule();
    }

    sceneApi.current = {
      recolor(hex) {
        if (!hex) return;
        finishMaterials.forEach(material => material.color.set(hex));
        schedule();
      },
      turn(dx, dy = 0) {
        yaw += dx;
        pitch = THREE.MathUtils.clamp(pitch + dy, -.9, .9);
        schedule();
      },
      reset() {
        yaw = shownYaw + THREE.MathUtils.euclideanModulo(initialYaw - shownYaw + Math.PI, 2 * Math.PI) - Math.PI;
        pitch = initialPitch;
        schedule();
      },
      spin(value) {
        spinning = value;
        earlier = null;
        schedule();
      },
      zoom(value) {
        camera.zoom = value;
        camera.updateProjectionMatrix();
        schedule();
      },
    };
    function lost(event) {
      event.preventDefault();
      setReady(false);
    }
    function restored() {
      resize();
      setReady(true);
    }
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("webglcontextrestored", restored);
    reducedMotion.addEventListener("change", schedule);
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    setReady(true);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(clockTimer);
      if (updateClock) document.removeEventListener("visibilitychange", syncClockVisibility);
      sceneApi.current = null;
      const materials = new Set();
      rig.traverse(part => {
        if (part.isMesh) {
          part.geometry.dispose();
          materials.add(part.material);
        }
      });
      for (const material of materials) {
        material.map?.dispose();
        material.bumpMap?.dispose();
        material.dispose();
      }
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      reducedMotion.removeEventListener("change", schedule);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [id, image, defaultFinish, showroom]);

  useEffect(() => {
    sceneApi.current?.recolor(selectedFinish);
  }, [id, image, defaultFinish, selectedFinish, showroom]);

  useEffect(() => {
    if (!controls) sceneApi.current?.spin(autoSpin);
  }, [autoSpin, controls, id, image, defaultFinish, showroom]);

  function startDrag(event) {
    if (!interactive || !ready || !event.isPrimary || event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    const last = drag.current;
    if (last?.pointer !== event.pointerId) return;
    sceneApi.current?.turn((event.clientX - last.x) * .012, (event.clientY - last.y) * .009);
    drag.current = { ...last, x: event.clientX, y: event.clientY };
  }

  function toggleRotation() {
    sceneApi.current?.spin(!rotating);
    setRotating(value => !value);
  }

  function changeZoom(value) {
    setZoom(value);
    sceneApi.current?.zoom(value);
  }

  function resetView() {
    sceneApi.current?.spin(false);
    sceneApi.current?.reset();
    setRotating(false);
    changeZoom(1);
  }

  return (
    <div className="device-viewer">
      {ready && interactive && image === "phone" && <time ref={clock} className="visually-hidden" aria-label="Местное время" />}
      <div className={ready && interactive ? "device-stage is-ready" : "device-stage"} onPointerDown={startDrag}
        onPointerMove={moveDrag} onLostPointerCapture={() => { drag.current = null; }}>
        {!ready && <ProductVisual image={image} productId={id} finish={finish ?? productColor(product)} className="device-fallback" eager />}
        <div className="device-canvas" ref={host} />
      </div>
      {controls && ready && (
        <div className="device-controls" role="group" aria-label="Управление 3D-моделью">
          <button type="button" aria-label="Повернуть влево" onClick={() => sceneApi.current?.turn(-Math.PI / 6)}>↶</button>
          <button type="button" aria-pressed={rotating} onClick={toggleRotation}>
            {rotating ? "Остановить" : "Вращать"}
          </button>
          <button type="button" aria-label="Повернуть вправо" onClick={() => sceneApi.current?.turn(Math.PI / 6)}>↷</button>
          <button type="button" aria-label="Уменьшить масштаб" disabled={zoom <= 1}
            onClick={() => changeZoom(zoom - .25)}>−</button>
          <button type="button" aria-label="Увеличить масштаб" disabled={zoom >= 1.5}
            onClick={() => changeZoom(zoom + .25)}>+</button>
          <button type="button" onClick={resetView}>Сбросить</button>
        </div>
      )}
    </div>
  );
}
