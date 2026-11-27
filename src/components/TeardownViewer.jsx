import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createPhoneParts, getStudioMap } from "./deviceModels.js";
import { createAudioTeardown, createLaptopTeardown } from "./teardownLaptopAudio.js";
import { createFlashTeardown, createPowerbankTeardown, createWatchTeardown } from "./teardownAccessories.js";

const phoneExploded = [
  [-2.78, 0, .48], [-1.38, -.23, .26], [-.03, .19, .08], [1.13, .35, .02], [2.46, 0, -.16],
];
const phoneInside = [
  [-.82, 0, .13], [.64, -.27, .158], [.64, .69, .157], [.40, .80, .238], [.64, 0, 0],
];
const phoneOpenAnchors = [
  [0, -.87, .07], [.02, -.12, .10], [.25, -.10, .09], [-.16, .19, .13], [.59, -.94, .13],
];
const phoneSpreadAnchors = [
  [0, -.95, .08], [0, -.53, .10], [0, -.27, .10], [0, -.24, .14], [0, -.95, .14],
];

const createAssembly = {
  phone: color => ({
    parts: createPhoneParts(color),
    exploded: phoneExploded,
    inside: phoneInside,
    openAnchors: phoneOpenAnchors,
    spreadAnchors: phoneSpreadAnchors,
    span: [7.4, 3.55],
  }),
  laptop: createLaptopTeardown,
  audio: createAudioTeardown,
  flash: createFlashTeardown,
  watch: createWatchTeardown,
  powerbank: createPowerbankTeardown,
};

const rotations = { ArrowLeft: [-.25, 0], ArrowRight: [.25, 0], ArrowUp: [0, -.25], ArrowDown: [0, .25] };

export default function TeardownViewer({ product, finish, mode, selected, focused, components, onSelect, onOverview }) {
  const viewport = useRef(null);
  const pins = useRef([]);
  const runtime = useRef(null);
  const [unavailable, setUnavailable] = useState(false);
  const isInspecting = focused !== null && !unavailable;
  const { id, image } = product;
  const finishHex = finish?.hex ?? product.colors?.[0]?.hex;

  useEffect(() => {
    const element = viewport.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setUnavailable(true);
      return;
    }
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    element.prepend(canvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.19;

    const scene = new THREE.Scene();
    scene.environment = getStudioMap();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 40);
    camera.position.set(0, 0, 12);
    const rig = new THREE.Group();
    scene.add(rig, new THREE.HemisphereLight(0xe9f3ff, 0x59656c, 2.1));
    const key = new THREE.DirectionalLight(0xe5f1ff, 2.5);
    key.position.set(-3, 5, 6);
    const rim = new THREE.DirectionalLight(0xd7e2ff, 1.9);
    rim.position.set(3, 2, -5);
    scene.add(key, rim);

    const { parts, exploded, inside, spreadAnchors, openAnchors, span, minHeight = 3.02, openRotations = [] } =
      createAssembly[image](finishHex, id);
    rig.add(...parts);
    const originalMaterials = new Set();
    const partMaterials = parts.map(part => {
      const materials = new Map();
      part.traverse(mesh => {
        if (!mesh.isMesh) return;
        const original = mesh.material;
        originalMaterials.add(original);
        if (!materials.has(original)) materials.set(original, original.clone());
        mesh.material = materials.get(original);
      });
      return materials;
    });
    const bounds = parts.map(part => new THREE.Box3().setFromObject(part).getBoundingSphere(new THREE.Sphere()));
    const lift = parts.map(() => 0);
    const layouts = [exploded, inside].map(layout => layout.map(point => new THREE.Vector3(...point)));
    const anchors = [spreadAnchors, openAnchors].map(layout => layout.map(point => new THREE.Vector3(...point)));
    const point = new THREE.Vector3();
    const targetAnchor = new THREE.Vector3();
    const ray = new THREE.Raycaster();
    const inverseRig = new THREE.Quaternion();
    const frontTurn = new THREE.Quaternion();
    const frontPosition = new THREE.Vector3();
    const centeredPosition = new THREE.Vector3();
    const rotation = new THREE.Euler(0, 0, 0, "YXZ");
    const identity = new THREE.Quaternion();
    const assemblyRotations = parts.map((_, index) =>
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(openRotations[index] ?? [0, 0, 0]))));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let open = 1;
    let targetOpen = 1;
    let angle = 0;
    let targetAngle = 0;
    let inspection = null;
    let yaw = -.34;
    let pitch = .23;
    let zoom = 1;
    let targetYaw = yaw;
    let targetPitch = pitch;
    let targetZoom = zoom;
    let frame = 0;
    let last = 0;
    let drag;
    let width = 1;
    let height = 1;

    function draw(time) {
      frame = 0;
      const elapsed = last ? Math.min((time - last) / 1000, .05) : 1 / 60;
      last = time;
      const easing = reduce ? 1 : 1 - Math.exp(-elapsed * 8);
      function approach(value, target) {
        return Math.abs(value - target) < .002 ? target : THREE.MathUtils.lerp(value, target, easing);
      }
      open = approach(open, targetOpen);
      angle = approach(angle, targetAngle);
      yaw = approach(yaw, targetYaw);
      pitch = approach(pitch, targetPitch);
      zoom = approach(zoom, targetZoom);
      parts.forEach((_, index) => { lift[index] = approach(lift[index], index === inspection ? 1 : 0); });
      const emphasis = Math.max(...lift);
      rig.rotation.set(.11, THREE.MathUtils.lerp(-.24, -.17, open) + angle, .043 - open * .028);
      const sceneWidth = THREE.MathUtils.lerp(span[0], span[1], open);
      const halfHeight = Math.max(minHeight / 2, sceneWidth * height / width / 2);
      const halfWidth = halfHeight * width / height;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      inverseRig.copy(rig.quaternion).invert();
      frontPosition.set(0, 0, 3.2).applyQuaternion(inverseRig);
      frontTurn.setFromEuler(rotation.set(pitch, yaw, 0)).premultiply(inverseRig);
      parts.forEach((part, index) => {
        const advance = lift[index];
        const backdrop = emphasis * (1 - advance);
        const opacity = 1 - backdrop;
        const frameRadius = Math.min(halfWidth, halfHeight) * .83;
        const focusScale = frameRadius * zoom / bounds[index].radius;
        centeredPosition.copy(bounds[index].center).applyQuaternion(frontTurn).multiplyScalar(-focusScale).add(frontPosition);
        part.position.lerpVectors(layouts[0][index], layouts[1][index], open);
        part.position.multiplyScalar(1 + backdrop * .24).lerp(centeredPosition, advance);
        part.quaternion.slerpQuaternions(identity, assemblyRotations[index], open).slerp(frontTurn, advance);
        part.scale.setScalar(THREE.MathUtils.lerp(1, focusScale, advance));
        part.visible = opacity > .015;
        for (const [original, material] of partMaterials[index]) {
          const faded = opacity < .995;
          material.opacity = original.opacity * opacity;
          material.depthWrite = original.depthWrite && !faded;
          material.transparent = original.transparent || faded;
        }
      });
      renderer.render(scene, camera);
      parts.forEach((part, index) => {
        const pin = pins.current[index];
        if (!pin) return;
        targetAnchor.lerpVectors(anchors[0][index], anchors[1][index], open);
        point.copy(targetAnchor);
        part.localToWorld(point).project(camera);
        pin.style.left = `${(point.x + 1) * 50}%`;
        pin.style.top = `${(1 - point.y) * 50}%`;
      });
      if (open !== targetOpen || angle !== targetAngle || yaw !== targetYaw || pitch !== targetPitch || zoom !== targetZoom
        || lift.some((value, index) => value !== (index === inspection ? 1 : 0))) schedule();
      else last = 0;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(([entry]) => {
      width = Math.max(1, entry.contentRect.width);
      height = Math.max(1, entry.contentRect.height);
      renderer.setSize(width, height, false);
      schedule();
    });
    observer.observe(element);
    const updateClock = parts.find(part => part.userData.updateClock)?.userData.updateClock;
    const clockTimer = updateClock && window.setInterval(() => {
      updateClock(new Date());
      schedule();
    }, 1000);

    runtime.current = {
      setMode(value) {
        targetOpen = value === "inside" ? 1 : 0;
        targetAngle = 0;
        schedule();
      },
      setFocus(index) {
        inspection = index;
        if (index !== null) {
          targetPitch = .23;
          targetYaw = -.34;
          targetZoom = 1;
        }
        schedule();
      },
      rotate(dx, dy) {
        targetYaw += dx;
        targetPitch += dy;
        schedule();
      },
      magnify(step) {
        targetZoom = THREE.MathUtils.clamp(targetZoom + step * .20, .8, 1.8);
        schedule();
      },
      start(event) {
        if (event.button !== 0 || !event.isPrimary) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, angle: targetAngle, yaw: targetYaw, pitch: targetPitch, moved: false };
        canvas.setPointerCapture(event.pointerId);
      },
      move(event) {
        if (drag?.id !== event.pointerId) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        drag.moved ||= Math.hypot(dx, dy) > 5;
        if (!drag.moved) return;
        if (inspection === null) {
          targetAngle = THREE.MathUtils.clamp(drag.angle + dx * .008, -.42, .50);
        } else {
          targetYaw = drag.yaw + dx * .012;
          targetPitch = drag.pitch + dy * .012;
        }
        schedule();
      },
      end(event) {
        if (drag?.id !== event.pointerId) return;
        const wasTap = !drag.moved && event.type === "pointerup";
        drag = undefined;
        if (!wasTap || inspection !== null) return;
        const bounds = canvas.getBoundingClientRect();
        point.set(2 * (event.clientX - bounds.left) / bounds.width - 1, 1 - 2 * (event.clientY - bounds.top) / bounds.height, 0);
        ray.setFromCamera(point, camera);
        let hit = ray.intersectObjects(parts)[0]?.object;
        while (hit && hit.parent !== rig) hit = hit.parent;
        return hit ? parts.indexOf(hit) : undefined;
      },
    };
    return () => {
      runtime.current = null;
      observer.disconnect();
      window.clearInterval(clockTimer);
      cancelAnimationFrame(frame);
      rig.traverse(part => {
        if (part.isMesh) part.geometry.dispose();
      });
      for (const materials of partMaterials) materials.forEach(material => material.dispose());
      originalMaterials.forEach(material => {
        material.map?.dispose();
        material.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [finishHex, id, image]);

  useEffect(() => runtime.current?.setMode(mode), [mode, finishHex, id, image]);
  useEffect(() => runtime.current?.setFocus(focused), [focused, finishHex, id, image]);
  useEffect(() => {
    if (isInspecting) viewport.current.focus({ preventScroll: true });
  }, [isInspecting, focused]);

  function handleKeys(event) {
    if (!isInspecting) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onOverview();
      return;
    }
    if (event.target !== event.currentTarget) return;
    const turn = rotations[event.key];
    if (turn) runtime.current?.rotate(...turn);
    else if (event.key === "+" || event.key === "=" || event.key === "-") {
      runtime.current?.magnify(event.key === "-" ? -1 : 1);
    } else return;
    event.preventDefault();
    event.stopPropagation();
  }

  function endDrag(event) {
    const index = runtime.current?.end(event);
    if (index !== undefined) onSelect(index);
  }

  return (
    <div ref={viewport} className="teardown-viewport" data-mode={mode} data-inspecting={isInspecting || undefined}
      tabIndex={isInspecting ? 0 : undefined} role="group"
      aria-label={isInspecting ? `${components[focused].name}: вращение стрелками, масштаб клавишами плюс и минус` : "3D-схема устройства"}
      onPointerDown={event => { if (event.target.tagName === "CANVAS") runtime.current?.start(event); }}
      onPointerMove={event => runtime.current?.move(event)}
      onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onKeyDown={handleKeys}>
      {unavailable ? <p className="teardown-unavailable">3D недоступно в этом браузере. Данные деталей открываются ниже.</p> :
        components.map(({ name }, index) => (
          <button type="button" key={name} ref={element => { pins.current[index] = element; }}
            hidden={isInspecting}
            className="teardown-pin" aria-label={`На схеме: ${name}`} aria-pressed={selected === index}
            onClick={() => onSelect(index)}>{String(index + 1).padStart(2, "0")}</button>
        ))}
      {isInspecting && (
        <div className="teardown-inspector">
          <button type="button" className="teardown-return" onClick={onOverview}>← Все детали</button>
          <div role="group" aria-label="Масштаб детали">
            <button type="button" aria-label="Отдалить" onClick={() => runtime.current?.magnify(-1)}>−</button>
            <button type="button" aria-label="Приблизить" onClick={() => runtime.current?.magnify(1)}>+</button>
          </div>
        </div>
      )}
      {!unavailable && <span className="teardown-drag" aria-hidden="true">{isInspecting ? "Потяните, чтобы повернуть" : "Нажмите на деталь"}</span>}
    </div>
  );
}
