import * as THREE from "three";
import { box, disc, engraving, face, flexConnector, glass, matte, metal, printedSurface, roundedPlate, screen } from "./deviceModels.js";

function screw(group, x, y, z, size, steel, dark) {
  disc(group, size, .013, steel, x, y, z);
  const slot = box(group, [size * 1.28, size * .27, .003], .001, dark, x, y, z + .007);
  slot.rotation.z = Math.PI / 5;
}

function chip(group, x, y, z, width, height, body, pins, name) {
  box(group, [width, height, .027], .009, body, x, y, z);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      box(group, [.011, .025, .009], .002, pins, x + (i - 3) * width / 8, y + side * height / 2, z - .009);
    }
  }
  face(group, width * .92, height * .38, engraving(name, "#acbbc5"), x, y, z + .015);
}

function fan(group, x, y, z, steel, dark, size) {
  disc(group, size, .049, steel, x, y, z);
  disc(group, size * .89, .018, dark, x, y, z + .026);
  const blades = metal(0x3d4751, .51);
  for (let i = 0; i < 13; i++) {
    const angle = i / 13 * Math.PI * 2;
    const blade = box(group, [size * .67, size * .12, .009], .004, blades,
      x + Math.cos(angle) * size * .5, y + Math.sin(angle) * size * .5, z + .037);
    blade.rotation.z = angle + .42;
  }
  disc(group, size * .26, .015, steel, x, y, z + .038);
}

export function createLaptopTeardown(color, id) {
  const [display, keyboard, board, battery, chassis] = Array.from({ length: 5 }, () => new THREE.Group());
  const alloy = metal(color ?? "#8a95a7", .32);
  const dark = matte(0x161c25, .72);
  const keys = matte(0x252c35, .69);
  const steel = metal(0x7c8c9f, .35);
  const copper = metal(0xb67244, .36);
  const gold = metal(0xc9a357, .39);
  const larger = id === "laptop-air" || id === "laptop-studio";

  roundedPlate(display, 1.84, 1.11, .064, .07, alloy, -.012);
  roundedPlate(display, 1.81, 1.08, .023, .055, dark, .023);
  face(display, 1.70, .93, screen(true), 0, -.01, .036);
  disc(display, .014, .011, glass(0x42627c), 0, .501, .038);
  face(display, .41, .09, engraving("VOLTFRAME"), 0, .025, -.046).rotation.y = Math.PI;
  for (const x of [-.64, .64]) box(display, [.24, .084, .077], .03, alloy, x, -.526, 0);
  flexConnector(display, .40, -.448, -.045, .15, .11, dark, gold, -1);

  roundedPlate(keyboard, 1.85, 1.14, .054, .075, alloy, 0);
  box(keyboard, [1.65, .59, .019], .01, dark, 0, .18, .027);
  const rows = ["1234567890-=", "QWERTYUIOP[]", "ASDFGHJKL;'↵", "⇧ZXCVBNM,./↑"];
  const keyWidth = .130;
  rows.forEach((row, rowIndex) => [...row].forEach((_, column) => {
    box(keyboard, [.115, .10, .021], .007, keys, (column - 5.5) * keyWidth, .40 - rowIndex * .119, .039);
  }));
  const keyLabels = printedSurface(900, 400, ctx => {
    ctx.fillStyle = "#d7e0eb";
    ctx.font = "600 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    rows.forEach((row, rowIndex) => [...row].forEach((key, column) => {
      ctx.fillText(key, (column + .5) * 75, (rowIndex + .5) * 100);
    }));
  });
  face(keyboard, keyWidth * 12, .476, keyLabels, 0, .2215, .051);
  box(keyboard, [.68, .076, .021], .01, keys, 0, -.058, .04);
  box(keyboard, [.63, .295, .015], .013, dark, 0, -.307, .026);
  box(keyboard, [.60, .27, .014], .012, alloy, 0, -.307, .035);
  flexConnector(keyboard, .21, -.23, -.042, .18, .36, dark, gold, -1);

  roundedPlate(board, 1.63, .49, .032, .044, matte(0x174b42, .62), 0);
  box(board, [.28, .31, .032], .011, matte(0x174b42), .67, -.21, 0);
  const traces = printedSurface(1024, 320, ctx => {
    for (let i = 0; i < 31; i++) {
      ctx.strokeStyle = i % 4 === 0 ? "#c2a16a" : "#567662";
      ctx.lineWidth = i % 5 === 0 ? 2.2 : 1;
      const x = 24 + i * 31;
      const y = 40 + i % 6 * 24;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 15, y + 17);
      ctx.lineTo(x + 15, 295 - i % 5 * 19);
      ctx.stroke();
    }
  });
  face(board, 1.57, .41, traces, 0, .003, .018);
  chip(board, -.185, -.022, .043, .29, .24, dark, steel, "SoC");
  chip(board, .17, -.062, .041, .19, .11, dark, steel, "SSD");
  for (const x of [-.35, -.12, .115, .333]) chip(board, x, -.148, .04, .103, .065, dark, steel, "RAM");
  const heatPipe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.70, .087, .095), new THREE.Vector3(-.26, .075, .095),
    new THREE.Vector3(.065, .14, .095), new THREE.Vector3(.51, .12, .095),
  ]);
  board.add(new THREE.Mesh(new THREE.TubeGeometry(heatPipe, 22, .02, 8), copper));
  for (const x of larger ? [-.61, .59] : [.59]) fan(board, x, .014, .048, steel, dark, .172);
  for (let i = 0; i < 10; i++) {
    box(board, [.024, .023, .019], .003, i % 3 === 0 ? gold : steel, -.42 + i * .087, .184, .032);
  }
  for (const x of [-.77, .76]) screw(board, x, -.188, .033, .027, gold, dark);

  roundedPlate(battery, 1.58, .55, .055, .085, steel, 0);
  for (let i = 0; i < 4; i++) {
    box(battery, [.365, .45, .064], .046, dark, (i - 1.5) * .385, -.011, .012);
    box(battery, [.299, .016, .009], .004, steel, (i - 1.5) * .385, .155, .046);
  }
  face(battery, .69, .105, engraving("VOLTFRAME / Li-ion", "#c5cfdb"), 0, .016, .047);
  flexConnector(battery, .18, .248, .037, .22, .15, dark, gold);

  roundedPlate(chassis, 1.90, 1.20, .074, .098, alloy, 0);
  roundedPlate(chassis, 1.81, 1.10, .018, .065, dark, .045);
  for (const x of [-.904, .904]) {
    box(chassis, [.043, .97, .075], .019, alloy, x, 0, .064);
    for (const y of [-.42, .42]) screw(chassis, x * .86, y, .062, .025, steel, dark);
    for (const y of [-.27, -.105, .062]) {
      box(chassis, [.026, .115, .04], .009, dark, x * 1.034, y, .038);
      box(chassis, [.016, .073, .015], .005, steel, x * 1.044, y, .04);
    }
  }
  for (const y of [-.552, .552]) box(chassis, [1.67, .043, .074], .019, alloy, 0, y, .064);
  for (let i = 0; i < 18; i++) {
    box(chassis, [.045, .025, .009], .004, steel, (i - 8.5) * .078, .46, -.04);
  }

  return {
    parts: [display, keyboard, board, battery, chassis],
    exploded: [[-3.52, .18, .18], [-1.69, -.22, .12], [0, .29, 0], [1.62, -.16, -.07], [3.43, .08, -.15]],
    inside: [[.66, .62, -.32], [-1.46, -.40, .14], [.66, -.33, .04], [.66, -.72, .40], [.66, -.53, .17]],
    spreadAnchors: [[0, -.47, .08], [0, -.45, .08], [-.1, -.17, .09], [0, -.20, .06], [0, -.48, .08]],
    openAnchors: [[.55, .26, .07], [-.37, -.28, .09], [-.32, .01, .15], [-.23, -.08, .10], [.85, -.43, .09]],
    openRotations: [[-.12, 0, 0], [-.48, 0, .08], [-.72, 0, 0], [-.72, 0, 0], [-.72, 0, 0]],
    span: [9.5, 4.65], minHeight: 2.65,
  };
}

function ring(group, x, y, z, radius, tube, material, oval = 1) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 64), material);
  mesh.position.set(x, y, z);
  mesh.scale.y = oval;
  group.add(mesh);
  return mesh;
}

export function createAudioTeardown(color, id) {
  const [cushion, driver, board, battery, housing] = Array.from({ length: 5 }, () => new THREE.Group());
  const alloy = metal(color ?? "#a0a5be", .30);
  const dark = matte(0x151922, .76);
  const liner = matte(0x31343c, .93);
  const steel = metal(0x8b9ca6, .41);
  const gold = metal(0xc79c50, .36);
  const padSize = id === "sound-mini" ? .91 : id === "sound-max" ? 1.08 : 1;
  const oval = 1.17;

  for (const [depth, radius, tube] of [[-.079, .337, .059], [.008, .331, .093], [.066, .331, .075]]) {
    ring(cushion, 0, 0, depth, radius * padSize, tube, liner, oval);
  }
  ring(cushion, 0, 0, .098, .365 * padSize, .009, dark, oval);
  const thread = metal(0x6b6674, .76);
  for (let i = 0; i < 38; i++) {
    const a = i / 38 * 2 * Math.PI;
    const stitch = box(cushion, [.015, .005, .004], .002, thread,
      Math.cos(a) * .363 * padSize, Math.sin(a) * .363 * oval * padSize, .107);
    stitch.rotation.z = a + Math.PI / 2;
  }

  disc(driver, .36 * padSize, .09, steel, 0, 0, -.024);
  disc(driver, .327 * padSize, .045, dark, 0, 0, .033);
  const cone = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.002, .068), new THREE.Vector2(.098, .068), new THREE.Vector2(.126, .054),
    new THREE.Vector2(.231, .032), new THREE.Vector2(.265, .041), new THREE.Vector2(.284, .057),
  ], 64), metal(0x53505f, .42));
  cone.rotation.x = Math.PI / 2;
  cone.scale.x = padSize;
  cone.scale.z = padSize;
  driver.add(cone);
  ring(driver, 0, 0, .054, .286 * padSize, .023, liner);
  disc(driver, .145, .092, metal(0x444955), 0, 0, -.092);
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5;
    screw(driver, Math.cos(a) * .331 * padSize, Math.sin(a) * .331 * padSize, .035, .012, gold, dark);
  }

  roundedPlate(board, .54, .36, .034, .06, matte(0x245548), 0);
  const circuit = printedSurface(512, 352, ctx => {
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = i % 3 === 0 ? "#b49659" : "#73947d";
      const x = 24 + i * 41;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, 80 + i % 4 * 40);
      ctx.lineTo(x + 18, 101 + i % 4 * 40);
      ctx.lineTo(x + 18, 327);
      ctx.stroke();
    }
  });
  face(board, .50, .31, circuit, 0, 0, .020);
  chip(board, -.028, .025, .042, .19, .14, dark, steel, "DSP");
  box(board, [.10, .09, .043], .01, steel, .15, -.04, .033);
  for (let i = 0; i < 8; i++) {
    box(board, [.022, .012, .014], .003, gold, -.185 + i * .05, -.12, .028);
  }
  flexConnector(board, .14, .137, .027, .12, .11, dark, gold);

  roundedPlate(battery, .45, .29, .094, .045, steel, 0);
  roundedPlate(battery, .419, .262, .083, .036, dark, .015);
  face(battery, .345, .083, engraving("Li-ion / VF"), 0, .009, .058);
  flexConnector(battery, .15, .13, .039, .10, .11, dark, gold);

  const arch = new THREE.CatmullRomCurve3(Array.from({ length: 27 }, (_, i) => {
    const a = i / 26 * Math.PI;
    return new THREE.Vector3(.77 * Math.cos(a), .78 * Math.sin(a) + .05, 0);
  }));
  housing.add(new THREE.Mesh(new THREE.TubeGeometry(arch, 46, .063, 12), alloy));
  const archLiner = new THREE.CatmullRomCurve3(arch.getPoints(20).slice(3, 18)
    .map(point => point.multiply(new THREE.Vector3(.95, .91, 1))));
  const lining = new THREE.Mesh(new THREE.TubeGeometry(archLiner, 27, .067, 10), liner);
  lining.scale.z = 1.43;
  housing.add(lining);
  for (const x of [-.758, .758]) {
    box(housing, [.094, .33, .13], .04, alloy, x, -.066, 0);
    for (let i = 0; i < 5; i++) box(housing, [.057, .007, .009], .003, steel, x, -.06 + i * .033, .072);
    disc(housing, .395 * padSize, .139, alloy, x, -.42, -.015).scale.z = oval;
    disc(housing, .365 * padSize, .043, steel, x, -.42, .055).scale.z = oval;
    ring(housing, x, -.42, .082, .339 * padSize, .036, dark, oval);
  }
  disc(housing, .314 * padSize, .052, liner, -.758, -.42, .089).scale.z = oval;
  ring(housing, -.758, -.42, .125, .297 * padSize, .067, liner, oval);
  disc(housing, .306 * padSize, .017, dark, .758, -.42, .081).scale.z = oval;
  for (const [x, y] of [[.47, -.44], [.76, -.785], [1.042, -.44]]) screw(housing, x, y, .094, .022, steel, dark);
  box(housing, [.14, .035, .067], .012, dark, .75, -.83 * padSize, -.003);
  face(housing, .37, .09, engraving(id === "echo-neon" ? "ECHO NEON" : "VOLTFRAME"),
    -.758, -.42, -.09).rotation.y = Math.PI;

  return {
    parts: [cushion, driver, board, battery, housing],
    exploded: [[-2.78, .09, .23], [-1.57, -.12, .12], [-.55, .17, .09], [.26, -.11, .04], [1.92, .06, -.15]],
    inside: [[-1.53, -.47, .30], [-.92, .045, .38], [1.12, -.23, .21], [1.18, -.55, .23], [.29, .04, -.06]],
    spreadAnchors: [[0, -.32, .14], [0, -.29, .12], [0, -.118, .08], [0, -.10, .078], [.58, -.57, .16]],
    openAnchors: [[0, -.30, .14], [0, -.24, .11], [.17, .04, .10], [.17, -.07, .085], [-.16, .65, .11]],
    openRotations: [[-.13, -.30, 0], [.14, -.36, -.10], [0, -.04, .08], [0, -.04, -.07], [0, 0, 0]],
    span: [6.95, 4.35], minHeight: 2.64,
  };
}
