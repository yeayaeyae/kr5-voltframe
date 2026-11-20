import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const finishById = {
  "prism-x1": 0x858d9f, "phone-pro": 0x527298, "phone-lite": 0xbc927c, "phone-max": 0x555768,
  "orbit-14": 0x929bad, "laptop-air": 0xc29c83, "laptop-studio": 0x6d7891, "laptop-go": 0x999181,
  "echo-neon": 0xa0a5be, "sound-pro": 0x63747b, "sound-mini": 0x936f87, "sound-max": 0x737ca5,
};

const metal = (color, roughness = 0.29) => new THREE.MeshStandardMaterial({ color, metalness: 0.58, roughness });
const matte = (color, roughness = 0.58) => new THREE.MeshStandardMaterial({ color, roughness });

function box(parent, size, radius, material, x = 0, y = 0, z = 0) {
  const part = new THREE.Mesh(new RoundedBoxGeometry(...size, 3, radius), material);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

function disc(parent, radius, depth, material, x, y, z) {
  const part = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 40), material);
  part.rotation.x = Math.PI / 2;
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

function screen(wide) {
  const canvas = Object.assign(document.createElement("canvas"), {
    width: wide ? 768 : 384,
    height: wide ? 480 : 768,
  });
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#14182c");
  background.addColorStop(0.49, wide ? "#273a60" : "#264f66");
  background.addColorStop(1, "#0d101d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width * .46, height * .52);
  ctx.rotate(wide ? -.31 : -.54);
  for (let band = 0; band < 30; band++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, width * (.23 + band * .012), height * (.15 + band * .008), 0, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${180 + band * 3.8}, 85%, ${62 - band * .6}%, .52)`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function phone(color) {
  const group = new THREE.Group();
  const shell = metal(color);
  const glass = metal(0x10151c, .18);
  const lens = metal(0x183754, .14);
  box(group, [1.23, 2.52, .18], .088, shell);
  box(group, [1.17, 2.46, .035], .018, glass, 0, 0, .09);
  box(group, [1.07, 2.31, .023], .011, screen(false), 0, 0, .113);
  box(group, [.25, .064, .026], .012, glass, 0, 1.015, .128);
  box(group, [1.18, 2.47, .028], .013, metal(color, .45), 0, 0, -.095);
  box(group, [.64, .65, .1], .049, shell, -.19, .77, -.141);
  for (const [x, y] of [[-.36, .91], [-.36, .61], [-.045, .76]]) {
    disc(group, .125, .055, glass, x, y, -.207);
    disc(group, .083, .04, lens, x, y, -.239);
    disc(group, .035, .04, metal(0x0f263d, .13), x, y, -.249);
  }
  disc(group, .041, .04, matte(0xe9e1ce), .02, .98, -.19);
  for (const y of [.27, .57]) box(group, [.039, .19, .077], .017, shell, -.624, y, 0);
  box(group, [.035, .34, .07], .017, shell, .624, .32, 0);
  box(group, [.22, .024, .065], .011, glass, 0, -1.261, .004);
  return group;
}

function laptop(color) {
  const group = new THREE.Group();
  const alloy = metal(color);
  const keys = matte(0x222a36);
  const dark = matte(0x121620);
  box(group, [2.65, .112, 1.7], .05, alloy, 0, -.46, .14);
  box(group, [2.34, .029, .83], .014, dark, 0, -.393, -.06);
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column < 13; column++) {
      if (row === 4 && column >= 3 && column <= 8) continue;
      box(group, [.133, .027, .115], .009, keys, (column - 6) * .169, -.37, -.375 + row * .151);
    }
  }
  box(group, [.98, .026, .108], .012, keys, -.083, -.37, .229);
  box(group, [.88, .016, .37], .008, metal(color, .48), 0, -.392, .61);
  for (const x of [-1.11, 1.11]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .24, 20), alloy);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, -.386, -.67);
    group.add(hinge);
    box(group, [.025, .039, .22], .005, dark, Math.sign(x) * 1.32, -.459, .46);
  }
  const lid = new THREE.Group();
  lid.position.set(0, -.4, -.66);
  lid.rotation.x = -.22;
  box(lid, [2.63, 1.57, .075], .037, alloy, 0, .785);
  box(lid, [2.53, 1.48, .038], .017, dark, 0, .785, .039);
  box(lid, [2.38, 1.33, .02], .009, screen(true), 0, .764, .06);
  disc(lid, .024, .025, metal(0x324666), 0, 1.473, .061);
  group.add(lid);
  return group;
}

function headphones(color) {
  const group = new THREE.Group();
  const shell = metal(color);
  const cushion = matte(0x242630, .92);
  const trim = metal(0x40a393, .34);
  const bandPoints = Array.from({ length: 33 }, (_, i) => {
    const theta = i / 32 * Math.PI;
    return new THREE.Vector3(1.02 * Math.cos(theta), .13 + 1.19 * Math.sin(theta), 0);
  });
  const band = new THREE.CatmullRomCurve3(bandPoints);
  const padded = new THREE.CatmullRomCurve3(bandPoints.slice(5, 28)
    .map(point => new THREE.Vector3(point.x * .94, point.y * .91, 0)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(band, 64, .086, 12), shell));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(padded, 48, .093, 12), cushion));
  for (const side of [-1, 1]) {
    box(group, [.1, .53, .18], .045, shell, side, -.09, 0);
    const cup = new THREE.Group();
    cup.position.set(side * .89, -.49, 0);
    cup.rotation.y = side * Math.PI / 2;
    cup.rotation.z = side * -.12;
    disc(cup, .455, .24, shell, 0, 0, .02).scale.z = 1.17;
    disc(cup, .4, .19, matte(0x302f3c, .83), 0, 0, -.13).scale.z = 1.17;
    disc(cup, .36, .035, trim, 0, 0, .151).scale.z = 1.17;
    disc(cup, .323, .038, shell, 0, 0, .173).scale.z = 1.17;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.327, .079, 14, 48), cushion);
    rim.position.z = -.231;
    rim.scale.y = 1.2;
    cup.add(rim);
    box(cup, [.11, .041, .032], .014, trim, 0, -.401, .13);
    group.add(cup);
  }
  group.position.y = -.16;
  return group;
}

export function createDevice({ image, id }) {
  const color = finishById[id] ?? 0x8895aa;
  if (image === "laptop") return laptop(color);
  if (image === "audio") return headphones(color);
  return phone(color);
}
