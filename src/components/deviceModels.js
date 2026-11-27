import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export { box, disc, engraving, face, finishMetal, flexConnector, glass, matte, metal, printedSurface, roundedPlate, screen };

const finishById = {
  "prism-x1": 0x858d9f, "phone-pro": 0x527298, "phone-lite": 0xbc927c, "phone-max": 0x555768,
  "orbit-14": 0x929bad, "laptop-air": 0xc29c83, "laptop-studio": 0x6d7891, "laptop-go": 0x999181,
  "echo-neon": 0xa0a5be, "sound-pro": 0x63747b, "sound-mini": 0x936f87, "sound-max": 0x737ca5,
};

const metal = (color, roughness = 0.29) => new THREE.MeshStandardMaterial({ color, metalness: 0.78, roughness });
const finishMetal = (color, roughness) => {
  const material = metal(color, roughness);
  material.userData.productFinish = true;
  return material;
};
const matte = (color, roughness = 0.58) => new THREE.MeshStandardMaterial({ color, roughness });
const glass = color => new THREE.MeshPhysicalMaterial({
  color, metalness: .29, roughness: .14, clearcoat: 1, clearcoatRoughness: .09,
});

function brushedFinish(color, roughness = .4) {
  const canvas = Object.assign(document.createElement("canvas"), { width: 128, height: 128 });
  const ink = canvas.getContext("2d");
  ink.fillStyle = "#777";
  ink.fillRect(0, 0, 128, 128);
  let seed = 29;
  for (let row = 0; row < 128; row++) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    const value = 95 + (seed >>> 26);
    ink.fillStyle = `rgb(${value} ${value} ${value})`;
    ink.fillRect((seed >>> 22) % 13, row, 102 + (seed >>> 25) % 27, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  const material = new THREE.MeshPhysicalMaterial({
    color, metalness: .87, roughness, anisotropy: .38, bumpMap: texture, bumpScale: .006,
  });
  material.userData.productFinish = true;
  return material;
}

function displayGlass(wide) {
  const pixels = screen(wide);
  const surface = new THREE.MeshPhysicalMaterial({
    map: pixels.map, color: 0xb8c3ce, roughness: .23, metalness: .04,
    emissiveMap: pixels.map, emissive: 0xffffff, emissiveIntensity: .62,
    clearcoat: 1, clearcoatRoughness: .15, envMapIntensity: .32,
  });
  surface.userData = pixels.userData;
  pixels.dispose();
  return surface;
}

function roundedPlate(parent, width, height, depth, radius, material, z) {
  const x = -width / 2;
  const y = -height / 2;
  const right = width / 2;
  const top = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(right - radius, y);
  shape.quadraticCurveTo(right, y, right, y + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(x + radius, top);
  shape.quadraticCurveTo(x, top, x, top - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const bevel = Math.min(.014, depth * .2);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 3, curveSegments: 12,
  });
  const part = new THREE.Mesh(geometry, material);
  part.position.z = z - depth / 2 + bevel;
  parent.add(part);
  return part;
}

function face(parent, width, height, material, x, y, z) {
  const part = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

function engraving(text, color = "#e7ebf1") {
  const canvas = Object.assign(document.createElement("canvas"), { width: 384, height: 96 });
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "600 47px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 192, 48);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false });
}

let studioMap;

export function getStudioMap() {
  if (studioMap) return studioMap;
  const canvas = Object.assign(document.createElement("canvas"), { width: 512, height: 256 });
  const ctx = canvas.getContext("2d");
  const room = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [stop, color] of [[0, "#394454"], [.20, "#7d8493"], [.53, "#303947"], [1, "#141b25"]]) {
    room.addColorStop(stop, color);
  }
  ctx.fillStyle = room;
  ctx.fillRect(0, 0, 512, 256);
  for (const [x, y, width, height, color] of [
    [41, 39, 74, 98, "#eef8ff"], [150, 31, 152, 27, "#fff6e6"],
    [351, 47, 30, 115, "#d9f0ff"], [407, 89, 68, 48, "#9cbde8"],
  ]) {
    ctx.shadowBlur = 13;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }
  studioMap = new THREE.CanvasTexture(canvas);
  studioMap.colorSpace = THREE.SRGBColorSpace;
  studioMap.mapping = THREE.EquirectangularReflectionMapping;
  return studioMap;
}

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

const clockFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function screen(wide) {
  const canvas = Object.assign(document.createElement("canvas"), {
    width: wide ? 768 : 384,
    height: wide ? 480 : 768,
  });
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  if (!wide) {
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 45);
    ctx.clip();
  }
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
  if (wide) {
    ctx.fillStyle = "#151d2bcd";
    ctx.fillRect(0, height - 29, width, 29);
    const symbols = ["#87e9ee", "#b1b5ff", "#99d9a4", "#f6bb86", "#9ab4e9"];
    for (const [index, color] of symbols.entries()) {
      ctx.beginPath();
      ctx.roundRect(width / 2 - 85 + index * 36, height - 23, 20, 18, 5);
      ctx.fillStyle = color;
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#f1f7ff";
    ctx.beginPath();
    ctx.roundRect(width * .32, height - 29, width * .36, 7, 4);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture });
  if (!wide) {
    const clockTop = 76;
    const wallpaper = ctx.getImageData(0, clockTop, width, 112);
    material.userData.updateClock = now => {
      const time = clockFormat.format(now);
      ctx.putImageData(wallpaper, 0, clockTop);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffffbf";
      ctx.font = "500 20px Arial";
      ctx.fillText(dateFormat.format(now), width / 2, 101);
      ctx.fillStyle = "#f1f7ff";
      ctx.font = "400 59px Arial";
      ctx.fillText(time, width / 2, 168, width - 40);
      texture.needsUpdate = true;
      return time;
    };
    material.userData.updateClock(new Date());
  }
  return material;
}

function phone(color) {
  const group = new THREE.Group();
  const shell = brushedFinish(color, .29);
  const trim = finishMetal(color, .16);
  const black = matte(0x11151a, .45);
  const lens = glass(0x13324d);
  roundedPlate(group, 1.21, 2.50, .17, .18, shell, 0);
  roundedPlate(group, 1.19, 2.47, .033, .17, glass(0x10151c), .088);
  const display = face(group, 1.12, 2.376, displayGlass(false), 0, 0, .108);
  display.material.alphaTest = .4;
  box(group, [.239, .066, .018], .008, black, 0, 1.035, .112);
  disc(group, .018, .006, lens, .084, 1.035, .124);
  roundedPlate(group, 1.18, 2.45, .028, .162, brushedFinish(color, .52), -.091);
  const badge = face(group, .41, .108, engraving("VOLTFRAME", "#ffffff9e"), 0, -.645, -.106);
  badge.rotation.y = Math.PI;
  box(group, [.68, .68, .096], .046, shell, -.174, .77, -.147);
  for (const [x, y] of [[-.355, .92], [-.355, .622], [-.061, .775]]) {
    disc(group, .139, .053, trim, x, y, -.205);
    disc(group, .118, .035, black, x, y, -.231);
    disc(group, .097, .019, lens, x, y, -.249);
    disc(group, .079, .012, metal(0x25364a, .21), x, y, -.258);
    const opticalElement = new THREE.Mesh(new THREE.SphereGeometry(.071, 36, 18), lens);
    opticalElement.position.set(x, y, -.254);
    opticalElement.scale.z = .29;
    group.add(opticalElement);
  }
  disc(group, .041, .016, matte(0xf8ebc9), .039, .992, -.203);
  disc(group, .016, .012, black, .04, .55, -.203);
  for (const y of [.27, .57]) box(group, [.039, .19, .077], .017, trim, -.616, y, 0);
  box(group, [.034, .34, .07], .016, trim, .616, .32, 0);
  for (const x of [-.603, .603]) {
    for (const y of [-.88, .875]) box(group, [.012, .024, .158], .005, black, x, y, 0);
  }
  box(group, [.203, .014, .068], .006, black, 0, -1.257, 0);
  box(group, [.132, .015, .019], .005, trim, 0, -1.26, -.006);
  for (const side of [-1, 1]) {
    for (let index = 0; index < 6; index++) {
      const speaker = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .007, 12), black);
      speaker.position.set(side * (.162 + index * .042), -1.262, 0);
      group.add(speaker);
    }
  }
  return group;
}

function laptop(color) {
  const group = new THREE.Group();
  const alloy = brushedFinish(color, .31);
  const keys = matte(0x222a36);
  const dark = matte(0x121620);
  box(group, [2.65, .103, 1.7], .048, alloy, 0, -.47, .14);
  box(group, [2.64, .034, 1.69], .017, finishMetal(color, .39), 0, -.417, .14);
  box(group, [2.285, .022, .817], .011, dark, 0, -.391, -.06);
  const labels = [
    ["esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "−", "+"],
    ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
    ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "↵"],
    ["⇧", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "↑", "⇧"],
    ["fn", "ctrl", "alt", "", "", "", "", "", "", "cmd", "←", "↓", "→"],
  ];
  const keyboard = Object.assign(document.createElement("canvas"), { width: 1152, height: 448 });
  const ink = keyboard.getContext("2d");
  ink.fillStyle = "#dbe4ed";
  ink.font = "500 24px Arial";
  ink.textAlign = "center";
  ink.textBaseline = "middle";
  labels.forEach((row, rowIndex) => row.forEach((label, column) => {
    if (!label) return;
    box(group, [.135, .027, .113], .007, keys, (column - 6) * .169, -.372, -.375 + rowIndex * .151);
    ink.fillText(label, (column + .5) * keyboard.width / 13, (rowIndex + .5) * keyboard.height / 5);
  }));
  const keyMap = new THREE.CanvasTexture(keyboard);
  keyMap.colorSpace = THREE.SRGBColorSpace;
  const legends = face(group, 2.197, .755, new THREE.MeshBasicMaterial({
    map: keyMap, transparent: true, alphaTest: .2, depthWrite: false,
  }), 0, -.357, -.073);
  legends.rotation.x = -Math.PI / 2;
  box(group, [.98, .026, .108], .012, keys, -.083, -.37, .229);
  box(group, [.938, .018, .392], .008, dark, 0, -.396, .587);
  box(group, [.915, .018, .365], .008, finishMetal(color, .5), 0, -.392, .587);
  box(group, [.37, .024, .037], .011, dark, 0, -.453, .993);
  for (const x of [-1.11, 1.11]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .24, 20), alloy);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, -.386, -.67);
    group.add(hinge);
    for (const z of [.12, .44]) {
      box(group, [.018, .036, .168], .007, dark, Math.sign(x) * 1.329, -.463, z);
      box(group, [.02, .013, .105], .004, metal(0x465361), Math.sign(x) * 1.337, -.466, z);
    }
    for (const z of [-.49, .78]) box(group, [.32, .023, .15], .011, dark, x, -.53, z);
    for (let index = 0; index < 15; index++) {
      box(group, [.064, .007, .011], .003, dark, Math.sign(x) * 1.222, -.398, -.57 + index * .071);
    }
  }
  const lid = new THREE.Group();
  lid.position.set(0, -.4, -.66);
  lid.rotation.x = -.22;
  const lidShell = roundedPlate(lid, 2.61, 1.55, .075, .09, alloy, 0);
  lidShell.position.y = .785;
  box(lid, [2.555, 1.48, .024], .012, dark, 0, .785, .037);
  face(lid, 2.47, 1.35, displayGlass(true), 0, .778, .051);
  disc(lid, .019, .007, glass(0x233d59), 0, 1.472, .052);
  disc(lid, .006, .006, matte(0x418685), .037, 1.474, .052);
  const lidMark = face(lid, .65, .165, engraving("VOLTFRAME", "#ebedf4ae"), 0, .87, -.04);
  lidMark.rotation.y = Math.PI;
  group.add(lid);
  return group;
}

function wovenFabric() {
  const size = 128;
  const canvas = Object.assign(document.createElement("canvas"), { width: size, height: size });
  const ctx = canvas.getContext("2d");
  const pattern = ctx.createImageData(size, size);
  let noise = 17;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      noise = (Math.imul(1664525, noise) + 1013904223) >>> 0;
      const weave = (x % 4 < 2) === (y % 4 < 2) ? 37 : -25;
      const level = 127 + weave + ((noise >>> 26) - 32);
      const pixel = (y * size + x) * 4;
      pattern.data.set([level, level, level, 255], pixel);
    }
  }
  ctx.putImageData(pattern, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 2);
  return new THREE.MeshStandardMaterial({
    color: 0x272831, roughness: .93, bumpMap: map, bumpScale: .018,
  });
}

function headphones(color) {
  const group = new THREE.Group();
  const shell = brushedFinish(color, .39);
  const bevel = finishMetal(color, .2);
  const cushion = wovenFabric();
  const dark = matte(0x20212a, .85);
  const trim = metal(0x286c60, .28);
  const bandPoints = Array.from({ length: 33 }, (_, i) => {
    const theta = i / 32 * Math.PI;
    return new THREE.Vector3(1.02 * Math.cos(theta), .13 + 1.19 * Math.sin(theta), 0);
  });
  const band = new THREE.CatmullRomCurve3(bandPoints);
  const padded = new THREE.CatmullRomCurve3(bandPoints.slice(5, 28)
    .map(point => new THREE.Vector3(point.x * .94, point.y * .91, 0)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(band, 64, .086, 12), shell));
  const padding = new THREE.Mesh(new THREE.TubeGeometry(padded, 48, .098, 16), cushion);
  padding.scale.z = 1.36;
  group.add(padding);
  for (const side of [-1, 1]) {
    box(group, [.11, .33, .20], .046, shell, side, .03, 0);
    box(group, [.077, .37, .129], .036, bevel, side * .995, -.192, 0);
    disc(group, .031, .013, bevel, side * 1.024, -.351, .077);
    box(group, [.026, .005, .007], .002, dark, side * 1.024, -.351, .086);
    for (let notch = 0; notch < 4; notch++) {
      box(group, [.008, .01, .065], .003, dark, side * 1.026, -.094 - notch * .034, 0);
    }
    const cup = new THREE.Group();
    cup.position.set(side * .89, -.49, 0);
    cup.rotation.y = side * Math.PI / 2;
    cup.rotation.z = side * -.12;
    disc(cup, .452, .22, shell, 0, 0, .022).scale.z = 1.17;
    disc(cup, .418, .049, bevel, 0, 0, .132).scale.z = 1.17;
    disc(cup, .371, .03, trim, 0, 0, .155).scale.z = 1.17;
    disc(cup, .355, .035, finishMetal(color, .43), 0, 0, .176).scale.z = 1.17;
    disc(cup, .397, .09, dark, 0, 0, -.128).scale.z = 1.17;
    disc(cup, .353, .043, cushion, 0, 0, -.185).scale.z = 1.17;
    for (const [depth, radius, tube] of [[-.25, .326, .083], [-.308, .322, .075]]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 18, 56), cushion);
      rim.position.z = depth;
      rim.scale.y = 1.22;
      cup.add(rim);
    }
    const seam = new THREE.Mesh(new THREE.TorusGeometry(.375, .006, 8, 48), dark);
    seam.position.z = -.308;
    seam.scale.y = 1.22;
    cup.add(seam);
    const sideMark = face(cup, .35, .09, engraving(side === 1 ? "R" : "L"), 0, 0, -.21);
    sideMark.rotation.y = Math.PI;
    box(cup, [.105, .024, .051], .009, dark, 0, -.525, .01);
    if (side === 1) {
      for (const x of [-.16, .16]) box(cup, [.076, .029, .029], .008, bevel, x, -.492, .071);
      disc(cup, .014, .011, matte(0x72dd91), .12, -.451, .143);
    }
    group.add(cup);
  }
  group.position.y = -.16;
  return group;
}

function flash(color, dual) {
  const group = new THREE.Group();
  const shell = brushedFinish(color, .33);
  const steel = metal(0xc9d5dc, .23);
  const plastic = matte(0x151a20);
  const contacts = metal(0xdab568, .3);
  box(group, [1.7, .61, .30], .12, shell, -.2, 0, 0);
  box(group, [1.56, .48, .024], .012, shell, -.2, 0, .147);
  box(group, [.69, .46, .21], .044, steel, .98, 0, 0);
  box(group, [.35, .32, .15], .02, plastic, 1.19, 0, 0);
  for (const y of [-.076, -.025, .025, .076]) {
    box(group, [.125, .012, .018], .004, contacts, 1.27, y, .081);
  }
  for (const y of [-.11, .11]) {
    box(group, [.135, .087, .013], .006, plastic, .96, y, .109);
  }
  if (dual) {
    box(group, [.43, .34, .14], .064, steel, -1.19, 0, 0);
    box(group, [.028, .265, .086], .013, plastic, -1.403, 0, 0);
    box(group, [.025, .18, .024], .008, steel, -1.416, 0, 0);
  } else {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.155, .036, 12, 44), shell);
    loop.position.x = -1.152;
    loop.scale.y = .88;
    group.add(loop);
  }
  face(group, 1.24, .30, engraving(dual ? "128 GB · DUO" : "PULSE · 64 GB"), -.19, 0, .161);
  group.rotation.z = -.19;
  return group;
}

function printedSurface(width, height, draw) {
  const canvas = Object.assign(document.createElement("canvas"), { width, height });
  draw(canvas.getContext("2d"));
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false });
}

function flexConnector(group, x, y, z, width, length, ribbon, contact, side = 1) {
  box(group, [width, length, .012], .005, ribbon, x, y, z);
  box(group, [width * .91, .045, .017], .004, contact, x, y - length / 2 + .029, z + side * .006);
  for (let pin = 0; pin < 7; pin++) {
    const offset = (pin - 3) * width / 8;
    box(group, [.005, length - .025, .003], .001, contact, x + offset, y, z + side * .007);
  }
}

export function createPhoneParts(color) {
  const display = new THREE.Group();
  const battery = new THREE.Group();
  const board = new THREE.Group();
  const cameras = new THREE.Group();
  const shell = new THREE.Group();
  const frame = metal(color ?? "#858d9f");
  const dark = matte(0x161b20);
  const steel = metal(0x9aabb8, .31);
  const gold = metal(0xba893b, .37);
  const chips = matte(0x20252a, .72);
  const graphite = metal(0x3f4852, .57);
  const ribbon = matte(0x67451d);
  const ceramic = matte(0xb7a993, .7);

  roundedPlate(display, 1.18, 2.42, .027, .14, dark, .016);
  roundedPlate(display, 1.151, 2.39, .021, .13, steel, -.008);
  roundedPlate(display, 1.123, 2.35, .022, .12, graphite, -.025);
  const panel = screen(false);
  face(display, 1.10, 2.30, panel, 0, 0, .032);
  display.userData.updateClock = panel.userData.updateClock;
  box(display, [.15, .026, .01], .006, dark, -.025, 1.085, .037);
  for (let index = 0; index < 10; index++) {
    box(display, [.006, .007, .003], .001, graphite, -.083 + index * .013, 1.085, .044);
  }
  disc(display, .018, .009, glass(0x375062), .085, 1.085, .037);
  box(display, [.92, 1.72, .013], .045, graphite, 0, .06, -.043);
  box(display, [.89, .17, .025], .014, dark, 0, -.97, -.047);
  flexConnector(display, .27, -.88, -.065, .25, .41, ribbon, gold, -1);
  for (const x of [-.524, .524]) for (const y of [-.99, -.43, .42, .99]) {
    box(display, [.055, .10, .02], .009, steel, x, y, -.05);
  }
  face(display, .57, .14, engraving("OLED  /  FLEX", "#a8b4bd"), 0, .47, -.051).rotation.y = Math.PI;

  box(battery, [.93, 1.42, .081], .056, steel);
  box(battery, [.921, 1.414, .057], .052, metal(0x24292b, .55));
  box(battery, [.886, 1.35, .086], .043, matte(0x212427, .74));
  for (const x of [-.435, .435]) box(battery, [.024, 1.23, .012], .005, graphite, x, .01, .042);
  const batteryLabel = printedSurface(512, 730, ctx => {
    ctx.fillStyle = "#ced5d7";
    ctx.font = "700 50px Arial";
    ctx.fillText("VOLTFRAME", 32, 112);
    ctx.font = "33px Arial";
    ctx.fillText("Li-ion polymer cell", 32, 166);
    ctx.strokeStyle = "#939b9f";
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 208, 446, 188);
    ctx.font = "24px Arial";
    ctx.fillText("RECHARGEABLE BATTERY", 52, 256);
    ctx.fillText("Do not puncture or bend", 52, 308);
    ctx.fillText("Recycle at a collection point", 52, 350);
    for (let index = 0; index < 41; index++) {
      ctx.fillRect(35 + index * 6, 487, index % 3 === 0 ? 4 : 2, 58);
    }
    ctx.font = "23px monospace";
    ctx.fillText("VF / CELL MODULE", 34, 591);
    ctx.font = "40px Arial";
    ctx.fillText("+", 432, 54);
    ctx.fillText("−", 388, 54);
  });
  face(battery, .81, 1.26, batteryLabel, 0, 0, .044);
  box(battery, [.86, .083, .025], .013, dark, 0, .656, .043);
  flexConnector(battery, .23, .72, .049, .22, .11, ribbon, gold);
  for (const x of [-.23, .23]) box(battery, [.19, .23, .012], .013, matte(0x696159), x, -.61, -.043);

  const boardShape = new THREE.Shape();
  const outline = [[-.49, .03], [-.49, .249], [-.42, .30], [.39, .30], [.49, .21],
    [.49, -.49], [.26, -.49], [.23, -.25], [-.28, -.25], [-.28, -.035], [-.41, -.035]];
  outline.forEach(([x, y], index) => index ? boardShape.lineTo(x, y) : boardShape.moveTo(x, y));
  boardShape.closePath();
  const laminate = new THREE.Mesh(new THREE.ExtrudeGeometry(boardShape, {
    depth: .037, bevelEnabled: true, bevelThickness: .006, bevelSize: .008, bevelSegments: 2,
  }), matte(0x1c5044, .65));
  laminate.position.z = -.02;
  board.add(laminate);
  const traces = printedSurface(768, 600, ctx => {
    ctx.beginPath();
    outline.forEach(([x, y], index) => {
      const point = [(x + .46) / .95 * 768, (.342 - y) / .63 * 600];
      if (index === 0) ctx.moveTo(...point);
      else ctx.lineTo(...point);
    });
    ctx.closePath();
    ctx.clip();
    ctx.translate(0, 3);
    for (let line = 0; line < 34; line++) {
      const x = 42 + line * 19;
      const bend = line % 7 * 21;
      ctx.strokeStyle = line % 3 === 0 ? "#a08848" : "#638870";
      ctx.lineWidth = line % 4 === 0 ? 2.4 : 1.25;
      ctx.beginPath();
      ctx.moveTo(x, 31);
      ctx.lineTo(x, 85 + bend);
      ctx.lineTo(x + 20, 109 + bend);
      ctx.lineTo(x + 20, 226 + (line % 4) * 22);
      ctx.stroke();
      ctx.fillStyle = "#c6ad66";
      ctx.fillRect(x + 17, 225 + (line % 4) * 22, 6, 6);
    }
    ctx.fillStyle = "#b4ccc1";
    ctx.font = "17px monospace";
    ctx.fillText("VF LOGIC PCB    REV 03    J402", 71, 51);
    ctx.fillText("AP01  /  U301", 403, 397);
  });
  face(board, .95, .63, traces, .015, .027, .024);
  face(board, .95, .63, traces, .015, .027, -.027).rotation.y = Math.PI;

  for (const [x, y, width, height, name] of [[.171, .093, .26, .23, "SoC"], [.145, -.155, .23, .12, "NAND"], [.37, -.32, .155, .19, "PMIC"]]) {
    box(board, [width, height, .033], .012, chips, x, y, .049);
    const label = engraving(name, "#adb7c1");
    face(board, width * .90, height * .38, label, x, y, .068);
    for (let pin = 0; pin < 7; pin++) {
      box(board, [.010, .024, .009], .002, steel, x + (pin - 3) * width / 8, y - height / 2, .032);
    }
  }
  box(board, [.259, .205, .045], .012, graphite, -.232, .114, .043);
  box(board, [.233, .17, .011], .009, steel, -.232, .114, .067);
  face(board, .187, .067, engraving("RF / SHLD", "#20252a"), -.232, .113, .074);
  box(board, [.30, .18, .036], .012, steel, .27, .11, -.040);
  face(board, .24, .083, engraving("VF / MAIN", "#2a323c"), .27, .11, -.06).rotation.y = Math.PI;
  for (let index = 0; index < 36; index++) {
    const x = -.24 + (index % 9) * .087;
    const y = [.254, -.055, -.09, -.215][Math.floor(index / 9)];
    box(board, [.031, .016, .012], .003, steel, x, y, .031);
    box(board, [.016, .016, .014], .003, index % 3 === 0 ? chips : ceramic, x, y, .034);
  }
  for (const x of [-.38, .07, .42]) {
    box(board, [.11, .044, .023], .004, chips, x, .26, .044);
    for (let pin = 0; pin < 7; pin++) {
      box(board, [.005, .03, .005], .001, gold, x - .04 + pin * .013, .26, .057);
    }
  }

  box(cameras, [.52, .525, .075], .075, graphite);
  box(cameras, [.49, .49, .016], .064, dark, 0, 0, .04);
  for (const [x, y, radius] of [[-.112, .12, .112], [.11, .025, .095], [-.10, -.12, .085]]) {
    disc(cameras, radius * 1.04, .041, graphite, x, y, .055);
    disc(cameras, radius, .066, steel, x, y, .074);
    disc(cameras, radius * .89, .025, dark, x, y, .10);
    disc(cameras, radius * .77, .021, metal(0x3e6470), x, y, .105);
    disc(cameras, radius * .69, .017, glass(0x112a49), x, y, .112);
    const optic = new THREE.Mesh(new THREE.SphereGeometry(radius * .61, 32, 16), glass(0x172e4c));
    optic.scale.z = .32;
    optic.position.set(x, y, .108);
    cameras.add(optic);
    box(cameras, [radius * 1.48, radius * 1.48, .025], .012, graphite, x, y, -.043);
  }
  flexConnector(cameras, .13, -.277, -.049, .142, .205, ribbon, gold, -1);
  face(cameras, .34, .078, engraving("CAM  /  OIS", "#b5c1c6"), -.02, .217, -.042).rotation.y = Math.PI;

  roundedPlate(shell, 1.21, 2.47, .077, .14, frame, 0);
  roundedPlate(shell, 1.13, 2.36, .018, .11, graphite, .045);
  roundedPlate(shell, 1.069, 2.308, .013, .102, matte(0x28343b), .058);
  roundedPlate(shell, 1.144, 2.388, .024, .13, frame, -.046);
  face(shell, .47, .12, engraving("VOLTFRAME", "#e1e8e5"), 0, -.55, -.061).rotation.y = Math.PI;
  for (const x of [-.574, .574]) box(shell, [.052, 2.16, .16], .023, frame, x, 0, .079);
  for (const y of [-1.177, 1.177]) box(shell, [1.01, .065, .16], .026, frame, 0, y, .08);
  for (const x of [-.47, .47]) for (const y of [-1.05, -.84, .42, 1.05]) {
    disc(shell, .034, .013, dark, x, y, .071);
    disc(shell, .022, .014, steel, x, y, .079);
    box(shell, [.028, .005, .004], .001, dark, x, y, .088);
    box(shell, [.006, .025, .004], .001, dark, x, y, .089);
  }
  for (let index = 0; index < 6; index++) {
    box(shell, [.053, .012, .036], .005, graphite, (index - 2.5) * .075, -1.213, .073);
  }
  box(shell, [.77, .14, .037], .028, dark, 0, -1.068, .088);
  box(shell, [.18, .031, .041], .013, steel, 0, -1.215, .072);
  box(shell, [.137, .035, .022], .009, dark, 0, -1.218, .072);
  box(shell, [.22, .117, .019], .014, gold, -.25, -1.062, .112);
  box(shell, [.038, .34, .072], .012, frame, .618, .49, .07);
  box(shell, [.036, .21, .071], .012, frame, -.618, .53, .07);
  box(shell, [.037, .136, .071], .012, frame, -.618, .22, .07);
  for (const [x, y] of [[-.32, .95], [-.12, .84], [-.33, .72]]) {
    disc(shell, .106, .041, frame, x, y, -.068);
    disc(shell, .073, .047, graphite, x, y, -.081);
    disc(shell, .052, .044, glass(0x183045), x, y, -.089);
  }
  return [display, battery, board, cameras, shell];
}

function smartWatch(color, rugged) {
  const group = new THREE.Group();
  const strap = matte(color, .83);
  strap.userData.productFinish = true;
  const casing = brushedFinish(color, .31);
  const rim = metal(rugged ? 0x56616d : 0x303b43);
  const dark = matte(0x141e25);
  const width = rugged ? 1.17 : 1.03;
  for (const side of [-1, 1]) {
    const band = box(group, [.68, .98, .102], .048, strap, 0, side * 1.003, -.065);
    band.rotation.x = side * .11;
    for (let index = 0; index < 5; index++) {
      box(group, [.34, .024, .011], .005, dark, 0, side * (.91 + index * .092), -.014 + index * .009);
    }
    box(group, [.81, .12, .17], .032, rim, 0, side * .57, -.012);
  }
  roundedPlate(group, width, 1.22, .21, .24, casing, 0);
  roundedPlate(group, width - .095, 1.12, .071, .21, rim, .107);
  roundedPlate(group, width - .16, 1.045, .035, .20, glass(0x112028), .15);
  const dial = printedSurface(384, 420, ctx => {
    ctx.translate(192, 208);
    for (let tick = 0; tick < 60; tick++) {
      const major = tick % 5 === 0;
      ctx.strokeStyle = major ? "#d7e7df" : "#5c7b81";
      ctx.lineWidth = major ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(0, -168);
      ctx.lineTo(0, major ? -150 : -160);
      ctx.stroke();
      ctx.rotate(Math.PI / 30);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#f2ebdd";
    ctx.font = "600 76px Arial";
    ctx.fillText("10:08", 0, 19);
    ctx.font = "600 22px Arial";
    ctx.fillText(rugged ? "TEMPO / TRAIL" : "TEMPO / ACTIVE", 0, -62);
    ctx.fillStyle = "#a8e5ca";
    ctx.font = "24px Arial";
    ctx.fillText(rugged ? "GPS   /   95%" : "ACTIVITY   /   95%", 0, 75);
  });
  face(group, width - .235, .875, dial, 0, 0, .172);
  const crown = disc(group, .086, .077, rim, width / 2 + .026, .14, .008);
  crown.rotation.set(0, 0, Math.PI / 2);
  box(group, [.083, .21, .083], .025, rim, width / 2 + .013, -.20, 0);
  disc(group, .27, .037, rim, 0, 0, -.121);
  disc(group, .22, .028, dark, 0, 0, -.14);
  for (const x of [-.082, .082]) for (const y of [-.082, .082]) {
    disc(group, .045, .012, glass(0x325447), x, y, -.159);
  }
  group.rotation.z = -.14;
  return group;
}

function powerBank(color) {
  const group = new THREE.Group();
  const trim = metal(0x26333c, .4);
  const dark = matte(0x151d25);
  roundedPlate(group, 1.12, 2.11, .33, .16, brushedFinish(color, .43), 0);
  box(group, [1.04, .16, .315], .064, trim, 0, 1.01, 0);
  for (const x of [-.25, .23]) {
    box(group, [.25, .085, .08], .034, metal(0xa7b6c0), x, 1.09, 0);
    box(group, [.201, .092, .047], .021, dark, x, 1.093, 0);
  }
  box(group, [.82, .33, .038], .017, glass(0x0b1e28), 0, .65, .171);
  face(group, .52, .15, engraving("100%", "#83eccf"), 0, .65, .193);
  face(group, .76, .19, engraving("FLUX 20"), 0, -.45, .168);
  for (let index = 0; index < 8; index++) {
    box(group, [.50, .013, .01], .004, trim, 0, .26 - index * .058, .168);
  }
  group.rotation.z = -.16;
  return group;
}

export function createDevice({ image, id, color: finish }) {
  const color = finish ?? finishById[id] ?? 0x8895aa;
  if (image === "flash") return flash(color, id === "shift-duo-128");
  if (image === "laptop") return laptop(color);
  if (image === "audio") return headphones(color);
  if (image === "watch") return smartWatch(color, id === "tempo-trail");
  if (image === "powerbank") return powerBank(color);
  const model = phone(color);
  if (id === "prism-neo") model.scale.set(.92, .91, 1);
  if (id === "prism-ultra") model.scale.set(1.06, 1.05, 1.12);
  return model;
}
