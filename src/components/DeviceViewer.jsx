import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createDevice } from "./deviceModels.js";
import { ProductVisual } from "./ProductVisual.jsx";

export default function DeviceViewer({ product, controls = false, interactive = true }) {
  const host = useRef(null);
  const sceneApi = useRef(null);
  const drag = useRef(null);
  const [ready, setReady] = useState(false);
  const [rotating, setRotating] = useState(false);
  const { id, image } = product;

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
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    const rig = new THREE.Group();
    rig.add(createDevice({ id, image }));
    scene.add(rig, new THREE.HemisphereLight(0xf2f1ff, 0x283441, 2.3));
    const key = new THREE.DirectionalLight(0xfff5e8, 3.5);
    key.position.set(3, 5, 6);
    const fill = new THREE.DirectionalLight(0x92caff, 2.4);
    fill.position.set(-4, 1, -3);
    const rim = new THREE.DirectionalLight(0xffffff, 1.6);
    rim.position.set(0, -1, 4);
    scene.add(key, fill, rim);

    const initialYaw = image === "phone" ? -.43 : -.57;
    const initialPitch = image === "laptop" ? .32 : .13;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    rig.rotation.set(initialPitch, initialYaw, image === "phone" ? -.1 : 0);
    let yaw = initialYaw;
    let pitch = initialPitch;
    let frame = 0;
    let spinning = false;
    let earlier = null;

    function render(time) {
      frame = 0;
      if (spinning && earlier !== null) yaw += Math.min(time - earlier, 33) * .0006;
      earlier = spinning ? time : null;
      const factor = reducedMotion.matches ? 1 : .19;
      rig.rotation.x += (pitch - rig.rotation.x) * factor;
      rig.rotation.y += (yaw - rig.rotation.y) * factor;
      renderer.render(scene, camera);
      if (spinning || Math.abs(yaw - rig.rotation.y) + Math.abs(pitch - rig.rotation.x) > .002) schedule();
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
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
      turn(dx, dy = 0) {
        yaw += dx;
        pitch = THREE.MathUtils.clamp(pitch + dy, -.9, .9);
        schedule();
      },
      reset() {
        yaw = rig.rotation.y + THREE.MathUtils.euclideanModulo(initialYaw - rig.rotation.y + Math.PI, 2 * Math.PI) - Math.PI;
        pitch = initialPitch;
        schedule();
      },
      spin(value) {
        spinning = value;
        earlier = null;
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
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    setReady(true);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
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
        material.dispose();
      }
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [id, image]);

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

  return (
    <div className="device-viewer">
      <div className={ready && interactive ? "device-stage is-ready" : "device-stage"} onPointerDown={startDrag}
        onPointerMove={moveDrag} onLostPointerCapture={() => { drag.current = null; }}>
        {!ready && <ProductVisual image={image} className="device-fallback" eager />}
        <div className="device-canvas" ref={host} />
      </div>
      {controls && ready && (
        <div className="device-controls" role="group" aria-label="Управление 3D-моделью">
          <button type="button" aria-label="Повернуть влево" onClick={() => sceneApi.current?.turn(-Math.PI / 6)}>↶</button>
          <button type="button" aria-pressed={rotating} onClick={toggleRotation}>
            {rotating ? "Остановить" : "Вращать"}
          </button>
          <button type="button" aria-label="Повернуть вправо" onClick={() => sceneApi.current?.turn(Math.PI / 6)}>↷</button>
          <button type="button" onClick={() => sceneApi.current?.reset()}>Сбросить</button>
        </div>
      )}
    </div>
  );
}
