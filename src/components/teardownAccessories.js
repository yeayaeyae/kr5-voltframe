import * as THREE from "three";
import { box, disc, engraving, face, flexConnector, glass, matte, metal, printedSurface, roundedPlate } from "./deviceModels.js";

function createMaterials(color) {
  return {
    trim: metal(color, .39),
    steel: metal(0xabbcc7, .31),
    gold: metal(0xd7a45a, .37),
    dark: matte(0x171d24, .69),
    substrate: matte(0x26534d, .59),
    ribbon: matte(0x684a24),
    ceramic: matte(0xa28f74, .64),
  };
}

function circuit(group, width, height, material, z = 0) {
  roundedPlate(group, width, height, .054, .054, material.substrate, z);
  const traces = printedSurface(384, 256, ctx => {
    for (let index = 0; index < 15; index++) {
      const y = 20 + index * 14;
      const endpoint = 105 + (index % 5) * 30;
      ctx.strokeStyle = index % 3 === 0 ? "#b68e54" : "#799c89";
      ctx.lineWidth = index % 3 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(65, y);
      ctx.lineTo(74 + (index % 4) * 7, y + 7);
      ctx.lineTo(endpoint, y + 7);
      ctx.stroke();
      ctx.fillStyle = "#c2a570";
      ctx.fillRect(endpoint - 2, y + 5, 4, 4);
      ctx.fillRect(340 + (index % 3) * 9, y, 4, 4);
    }
    ctx.font = "13px monospace";
    ctx.fillStyle = "#d9e0d2";
    ctx.fillText("VF / PCB", 268, 232);
  });
  face(group, width * .95, height * .93, traces, 0, 0, z + .028);
  for (let index = 0; index < 8; index++) {
    const x = (index - 3.5) * width * .098;
    const y = height * .33;
    box(group, [.039, .030, .014], .003, material.steel, x, y, z + .033);
    box(group, [.020, .031, .014], .002, index % 3 ? material.ceramic : material.dark, x, y, z + .039);
  }
}

function chip(group, x, y, z, width, height, label, material) {
  box(group, [width, height, .067], .034, material.dark, x, y, z);
  face(group, width * .91, height * .46, engraving(label, "#aebbc3"), x, y, z + .035);
  const pinLength = Math.min(.049, height * .22);
  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index++) {
      box(group, [.014, pinLength * 2, .015], .004, material.gold,
        x + (index - 4) * width / 10, y + side * height / 2, z - .029);
    }
  }
}

function socket(group, x, y, width, height, material, z = 0) {
  for (const side of [-1, 1]) {
    box(group, [width, .029, height], .012, material.steel, x, y + side * height / 2, z);
    box(group, [.029, height, height], .012, material.steel, x + side * width / 2, y, z);
  }
  box(group, [width * .72, .022, height * .84], .01, material.dark, x, y, z);
  for (let index = 0; index < 6; index++) {
    box(group, [.013, .01, height * .60], .004, material.gold, x + (index - 2.5) * width * .105, y + .016, z);
  }
}

export function createFlashTeardown(color, id) {
  const dual = id === "shift-duo-128";
  const material = createMaterials(color ?? (dual ? "#bdc5cf" : "#353c49"));
  const [connectors, memory, controller, housing] = Array.from({ length: 4 }, () => new THREE.Group());

  const plug = new THREE.Group();
  socket(plug, 0, 0, .42, .19, material);
  for (const y of [-.113, .113]) box(plug, [.45, .017, .28], .008, material.steel, 0, y, -.19);
  box(plug, [.382, .152, .078], .015, material.dark, 0, 0, -.278);
  plug.rotation.y = Math.PI / 2;
  plug.position.x = dual ? .76 : 0;
  connectors.add(plug);
  if (dual) {
    const usbC = new THREE.Group();
    socket(usbC, 0, 0, .27, .105, material);
    box(usbC, [.254, .098, .106], .028, material.steel, 0, 0, -.092);
    usbC.rotation.y = -Math.PI / 2;
    usbC.position.x = -.77;
    connectors.add(usbC);
  }

  chip(memory, 0, 0, .016, .53, .32, dual ? "128 GB" : "64 GB", material);
  face(memory, .49, .22, engraving("NAND / VF", "#a8b4ba"), 0, 0, -.024).rotation.y = Math.PI;

  circuit(controller, 1.41, .47, material);
  chip(controller, .40, 0, .063, .23, .23, "CTRL", material);
  for (const x of [-.655, .655]) for (let index = 0; index < 5; index++) {
    box(controller, [.074, .022, .006], .002, material.gold, x, (index - 2) * .067, .030);
  }

  roundedPlate(housing, 1.73, .65, .095, .15, material.trim, -.039);
  for (const y of [-.294, .294]) box(housing, [1.61, .065, .205], .028, material.trim, 0, y, .019);
  for (const x of [-.72, .72]) {
    disc(housing, .040, .018, material.steel, x, .255, .110);
    box(housing, [.045, .009, .004], .002, material.dark, x, .255, .121);
  }
  if (!dual) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.139, .034, 10, 30), material.trim);
    loop.position.x = -.95;
    housing.add(loop);
  }
  face(housing, 1.17, .23, engraving(dual ? "SHIFT DUO" : "PULSE"), 0, 0, -.091).rotation.y = Math.PI;

  return {
    parts: [connectors, memory, controller, housing],
    exploded: [[-2.75, .11, .26], [-1.05, -.10, .20], [.20, .16, .03], [2.23, -.08, -.19]],
    inside: [[dual ? 0 : .76, 0, .13], [-.25, -.012, .205], [0, 0, .128], [0, 0, 0]],
    spreadAnchors: [[0, -.36, .20], [0, -.25, .07], [0, -.36, .09], [0, -.35, .16]],
    openAnchors: [[dual ? 1.03 : .27, -.08, .15], [-.29, -.24, .14], [.36, .27, .12], [-.74, .30, .12]],
    span: [7.95, 3.05],
    minHeight: 1.02,
  };
}

export function createWatchTeardown(color, id) {
  const rugged = id === "tempo-trail";
  const finish = color ?? (rugged ? "#cc7d43" : "#5c8777");
  const material = createMaterials(finish);
  const [display, logic, battery, watchCase, strap] = Array.from({ length: 5 }, () => new THREE.Group());
  const width = rugged ? 1.19 : 1.06;

  roundedPlate(display, width - .07, 1.125, .071, .22, material.steel, 0);
  roundedPlate(display, width - .135, 1.065, .039, .207, glass(0x11272b), .041);
  const dial = printedSurface(360, 360, ctx => {
    const accent = rugged ? "#ffb15f" : "#a7e6c7";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(180, 171, 125, -.7 * Math.PI, 1.14 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#e8f1e9";
    ctx.textAlign = "center";
    ctx.font = "700 69px system-ui";
    ctx.fillText("10:08", 180, 194);
    ctx.font = "700 24px system-ui";
    ctx.fillStyle = accent;
    ctx.fillText(rugged ? "TRAIL" : "TEMPO", 180, 246);
  });
  face(display, width - .18, 1.02, dial, 0, 0, .062);
  flexConnector(display, .20, -.45, -.043, .205, .31, material.ribbon, material.gold, -1);
  face(display, .56, .17, engraving("AMOLED / VF"), 0, .15, -.039).rotation.y = Math.PI;

  circuit(logic, .78, .53, material);
  chip(logic, -.15, -.045, .059, .246, .24, "SOC", material);
  chip(logic, .172, -.062, .059, .174, .16, "RF", material);
  flexConnector(logic, .27, -.22, .035, .11, .142, material.ribbon, material.gold);

  roundedPlate(battery, .70, .50, .107, .053, material.steel, 0);
  roundedPlate(battery, .672, .472, .116, .046, material.dark, .002);
  face(battery, .60, .23, engraving("LI-ION / VF"), 0, 0, .061);
  flexConnector(battery, .205, .212, .062, .122, .123, material.ribbon, material.gold);

  roundedPlate(watchCase, width, 1.24, .096, .22, material.trim, -.048);
  roundedPlate(watchCase, width - .092, 1.141, .031, .185, material.dark, .011);
  for (const x of [-1, 1]) {
    box(watchCase, [.074, .76, .137], .032, material.trim, x * (width / 2 - .025), 0, .015);
    for (const y of [-.44, .44]) disc(watchCase, .049, .034, material.steel, x * (width / 2 - .155), y, .035);
  }
  for (const y of [-.575, .575]) box(watchCase, [.68, .11, .132], .049, material.trim, 0, y, .005);
  const crown = disc(watchCase, .087, .088, material.steel, width / 2 + .032, .14, .025);
  crown.rotation.set(0, 0, Math.PI / 2);
  box(watchCase, [.064, .179, .061], .025, material.trim, width / 2 + .017, -.15, .022);
  disc(watchCase, .289, .058, material.steel, 0, 0, -.108);
  disc(watchCase, .246, .064, glass(0x1b2d34), 0, 0, -.121);
  const sensor = glass(0x227861);
  for (const x of [-.09, .09]) for (const y of [-.075, .075]) disc(watchCase, .045, .034, sensor, x, y, -.154);

  const silicone = matte(finish, .84);
  for (const direction of [-1, 1]) {
    const band = box(strap, [.635, .96, .083], .038, silicone, 0, direction * 1.002, 0);
    band.rotation.x = direction * .10;
    box(strap, [.696, .12, .11], .033, material.steel, 0, direction * .568, .004);
    for (let index = 0; index < 5; index++) {
      box(strap, [.26, .028, .01], .004, material.dark, 0, direction * (.88 + index * .095), .044 + index * .008);
    }
  }
  box(strap, [.655, .08, .140], .024, material.steel, 0, -1.425, -.009);

  return {
    parts: [display, logic, battery, watchCase, strap],
    exploded: [[-2.65, .04, .37], [-1.26, .19, .25], [-.08, -.15, .16], [1.22, .04, .06], [2.69, -.06, -.18]],
    inside: [[-1.03, .05, .09], [.48, .257, .142], [.47, -.239, .161], [.48, 0, 0], [.48, 0, -.092]],
    spreadAnchors: [[0, -.45, .12], [0, -.34, .09], [0, -.31, .09], [0, -.50, .12], [0, -.81, .12]],
    openAnchors: [[0, -.47, .10], [.15, .14, .11], [-.02, -.18, .13], [.46, -.41, .11], [.02, -.88, .10]],
    span: [7.55, 3.6],
    minHeight: 1.57,
  };
}

export function createPowerbankTeardown(color) {
  const material = createMaterials(color ?? "#587082");
  const [cover, batteryPack, powerBoard, ports, housing] = Array.from({ length: 5 }, () => new THREE.Group());

  roundedPlate(cover, 1.16, 2.12, .077, .152, material.trim, 0);
  box(cover, [.82, .317, .028], .017, glass(0x0b1e28), 0, .65, .048);
  face(cover, .525, .141, engraving("100%", "#82eecb"), 0, .65, .065);
  face(cover, .75, .186, engraving("FLUX 20"), 0, -.46, .041);
  for (let index = 0; index < 8; index++) {
    box(cover, [.50, .012, .01], .004, material.dark, 0, .24 - index * .057, .043);
  }
  for (const x of [-.485, .485]) box(cover, [.043, 1.82, .02], .008, material.dark, x, 0, -.045);

  const cellWrap = metal(0x8e9eb0, .41);
  for (const x of [-.235, .235]) {
    box(batteryPack, [.446, 1.25, .21], .083, cellWrap, x, 0, 0);
    for (const y of [-.555, .555]) box(batteryPack, [.446, .11, .215], .039, material.ribbon, x, y, 0);
    face(batteryPack, .33, .39, engraving("LI-ION", "#15212a"), x, -.018, .109);
    box(batteryPack, [.06, .134, .014], .006, material.gold, x, .60, .045);
  }
  box(batteryPack, [.939, .073, .215], .019, material.dark, 0, -.29, 0);
  box(batteryPack, [.939, .073, .215], .019, material.dark, 0, .20, 0);

  circuit(powerBoard, .96, .46, material);
  chip(powerBoard, .21, -.053, .059, .208, .193, "PD", material);
  box(powerBoard, [.218, .206, .098], .026, material.ceramic, -.223, -.027, .063);
  face(powerBoard, .198, .12, engraving("4R7", "#262b30"), -.223, -.028, .113);
  for (const x of [-.37, -.072]) {
    disc(powerBoard, .049, .125, material.dark, x, -.113, .070);
    disc(powerBoard, .037, .012, material.steel, x, -.113, .137);
  }

  const portBody = new THREE.Group();
  box(portBody, [.956, .151, .155], .034, material.dark);
  for (const x of [-.25, .25]) socket(portBody, x, 0, .327, .109, material, .088);
  portBody.rotation.x = -Math.PI / 2;
  ports.add(portBody);

  roundedPlate(housing, 1.17, 2.14, .086, .157, material.trim, -.108);
  roundedPlate(housing, 1.071, 2.02, .039, .116, material.dark, -.056);
  for (const x of [-.532, .532]) {
    box(housing, [.08, 1.89, .249], .037, material.trim, x, 0, -.014);
    for (const y of [-.91, .91]) disc(housing, .052, .049, material.steel, x * .835, y, .036);
  }
  box(housing, [1.004, .118, .25], .053, material.trim, 0, -.982, -.011);
  for (const x of [-.457, 0, .457]) box(housing, [.14, .079, .238], .035, material.trim, x, .986, -.016);

  return {
    parts: [cover, batteryPack, powerBoard, ports, housing],
    exploded: [[-2.68, .03, .31], [-1.25, -.14, .22], [.07, .23, .12], [1.28, .05, .04], [2.59, -.005, -.13]],
    inside: [[-.86, -.046, .075], [.64, -.273, .051], [.64, .640, .137], [.64, .966, .089], [.64, -.035, 0]],
    spreadAnchors: [[0, -.80, .12], [0, -.55, .17], [0, -.29, .12], [0, -.27, .12], [0, -.79, .13]],
    openAnchors: [[0, -.80, .12], [0, -.30, .16], [-.23, .06, .13], [.25, .14, .12], [.49, -.77, .15]],
    span: [7.5, 3.65],
    minHeight: 1.43,
  };
}
