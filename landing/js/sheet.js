/*
 * Генератор демо-листа: фланец с четырьмя отверстиями, лист A4 (297 × 210 мм), масштаб 1:1.
 * Строит SVG-строку для выбранного стандарта. Все координаты — миллиметры листа.
 * Это упрощённая иллюстрация того, что делает настоящий генератор sheetgen на сервере.
 */

const PART = {
  hubLength: 25,
  diskThickness: 15,
  outerD: 120,
  hubD: 60,
  boreD: 40,
  holeD: 12,
  holeCount: 4,
  pcd: 90,
  massKg: 1.44, // сталь 45, объём ≈ 183 см³
};

export const STANDARDS = {
  GOST: {
    label: 'ГОСТ',
    font: "osifont, 'IBM Plex Sans', sans-serif",
    italic: true,
    projection: 'first',
    inch: false,
    holes: (d) => `${PART.holeCount} отв. ${d}`,
    diam: '⌀',
    titleBlock: 'gost',
    summary: 'ГОСТ, A4, масштаб 1:1',
  },
  ISO: {
    label: 'ISO',
    font: "'IBM Plex Sans', Arial, sans-serif",
    italic: false,
    projection: 'first',
    inch: false,
    holes: (d) => `${PART.holeCount}× ${d}`,
    diam: 'Ø',
    titleBlock: 'iso',
    summary: 'ISO, A4, scale 1:1',
  },
  ASME: {
    label: 'ASME',
    font: "'IBM Plex Sans', Arial, sans-serif",
    italic: false,
    projection: 'third',
    inch: true,
    holes: (d) => `${PART.holeCount}X ${d}`,
    diam: 'Ø',
    titleBlock: 'asme',
    summary: 'ASME, A4, дюймы, масштаб 1:1',
  },
};

export const LAYERS = ['visible', 'hidden', 'center', 'dims', 'hatch'];

/* Размер в выбранных единицах: мм с запятой для ГОСТ, мм для ISO, дюймы без ведущего нуля для ASME. */
function fmt(std, mm) {
  if (std.inch) {
    const s = (mm / 25.4).toFixed(3);
    return s.startsWith('0') ? s.slice(1) : s;
  }
  const s = String(mm);
  return std === STANDARDS.GOST ? s.replace('.', ',') : s;
}

const n = (v) => Math.round(v * 100) / 100;

function line(x1, y1, x2, y2, extra = '') {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"${extra}/>`;
}

function text(x, y, str, { size = 3.5, anchor = 'middle', rotate = 0, weight } = {}) {
  const t = rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : '';
  const w = weight ? ` font-weight="${weight}"` : '';
  return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="${anchor}"${w}${t}>${str}</text>`;
}

/* Замкнутая стрелка размерной линии: остриё в (x, y), направление по углу. */
function arrow(x, y, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  const len = 2.5;
  const half = 0.45;
  const bx = x - Math.cos(a) * len;
  const by = y - Math.sin(a) * len;
  const px = -Math.sin(a) * half;
  const py = Math.cos(a) * half;
  return `<polygon points="${n(x)},${n(y)} ${n(bx + px)},${n(by + py)} ${n(bx - px)},${n(by - py)}"/>`;
}

/* Линейный размер: вертикальный (x = const) или горизонтальный (y = const). */
function dimVertical(x, y1, y2, label) {
  return (
    line(x, y1, x, y2) +
    arrow(x, y1, -90) +
    arrow(x, y2, 90) +
    text(x - 1, (y1 + y2) / 2, label, { rotate: -90 })
  );
}

function dimHorizontal(y, x1, x2, label) {
  return (
    line(x1, y, x2, y) +
    arrow(x1, y, 180) +
    arrow(x2, y, 0) +
    text((x1 + x2) / 2, y - 1, label)
  );
}

/* Выноска с полкой: от точки на контуре к полке, надпись над полкой. */
function leader(fromX, fromY, kneeX, kneeY, shelfTo, label) {
  const anchor = shelfTo > kneeX ? 'start' : 'end';
  const tx = shelfTo > kneeX ? kneeX + 0.8 : kneeX - 0.8;
  const angle = (Math.atan2(fromY - kneeY, fromX - kneeX) * 180) / Math.PI;
  return (
    line(kneeX, kneeY, fromX, fromY) +
    arrow(fromX, fromY, angle) +
    line(kneeX, kneeY, shelfTo, kneeY) +
    text(tx, kneeY - 1, label, { anchor })
  );
}

function circle(cx, cy, r, extra = '') {
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${extra}/>`;
}

/* Главный вид: полувид-полуразрез. Ось детали горизонтальна, ступица слева. */
function frontView(std, x0, y0) {
  const a = x0;
  const b = x0 + PART.hubLength;
  const c = b + PART.diskThickness;
  const R = PART.outerD / 2;
  const Rh = PART.hubD / 2;
  const rb = PART.boreD / 2;
  const hy = PART.pcd / 2;
  const rh = PART.holeD / 2;

  const visible = [
    // верхняя половина — разрез
    line(a, y0 - Rh, a, y0),
    line(a, y0 - Rh, b, y0 - Rh),
    line(b, y0 - R, b, y0 - Rh),
    line(b, y0 - R, c, y0 - R),
    line(c, y0 - R, c, y0),
    line(b, y0 - hy - rh, c, y0 - hy - rh),
    line(b, y0 - hy + rh, c, y0 - hy + rh),
    line(a, y0 - rb, c, y0 - rb),
    // нижняя половина — вид
    line(a, y0, a, y0 + Rh),
    line(a, y0 + Rh, b, y0 + Rh),
    line(b, y0 + Rh, b, y0 + R),
    line(b, y0 + R, c, y0 + R),
    line(c, y0, c, y0 + R),
  ].join('');

  const hidden = [
    line(a, y0 + rb, c, y0 + rb),
    line(b, y0 + hy - rh, c, y0 + hy - rh),
    line(b, y0 + hy + rh, c, y0 + hy + rh),
  ].join('');

  const center = [
    line(a - 5, y0, c + 5, y0),
    line(b - 3, y0 - hy, c + 3, y0 - hy),
    line(b - 3, y0 + hy, c + 3, y0 + hy),
  ].join('');

  const p1 = [
    [a, y0 - Rh], [b, y0 - Rh], [b, y0 - hy + rh], [c, y0 - hy + rh], [c, y0 - rb], [a, y0 - rb],
  ];
  const p2 = [
    [b, y0 - R], [c, y0 - R], [c, y0 - hy - rh], [b, y0 - hy - rh],
  ];
  const poly = (pts) => `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}"/>`;
  const hatch = poly(p1) + poly(p2);

  const D = std.diam;
  const dims = [
    // выносные линии диаметров влево
    line(b, y0 - R, a - 30, y0 - R),
    line(b, y0 + R, a - 30, y0 + R),
    line(a, y0 - Rh, a - 20, y0 - Rh),
    line(a, y0 + Rh, a - 20, y0 + Rh),
    line(a, y0 - rb, a - 10, y0 - rb),
    line(a, y0 + rb, a - 10, y0 + rb),
    dimVertical(a - 28, y0 - R, y0 + R, `${D}${fmt(std, PART.outerD)}`),
    dimVertical(a - 18, y0 - Rh, y0 + Rh, `${D}${fmt(std, PART.hubD)}`),
    dimVertical(a - 8, y0 - rb, y0 + rb, `${D}${fmt(std, PART.boreD)}`),
    // длины
    line(b, y0 + R, b, y0 + R + 12),
    line(c, y0 + R, c, y0 + R + 22),
    line(a, y0 + Rh, a, y0 + R + 22),
    dimHorizontal(y0 + R + 10, b, c, fmt(std, PART.diskThickness)),
    dimHorizontal(y0 + R + 20, a, c, fmt(std, PART.hubLength + PART.diskThickness)),
  ].join('');

  return { visible, hidden, center, hatch, dims };
}

/* Вид со стороны ступицы: окружности и четыре отверстия. */
function sideView(std, cx, cy) {
  const R = PART.outerD / 2;
  const hy = PART.pcd / 2;
  const rh = PART.holeD / 2;
  const holes = [[cx + hy, cy], [cx - hy, cy], [cx, cy - hy], [cx, cy + hy]];

  const visible = [
    circle(cx, cy, R),
    circle(cx, cy, PART.hubD / 2),
    circle(cx, cy, PART.boreD / 2),
    ...holes.map(([x, y]) => circle(x, y, rh)),
  ].join('');

  const center = [
    line(cx - R - 5, cy, cx + R + 5, cy),
    line(cx, cy - R - 5, cx, cy + R + 5),
    circle(cx, cy, hy),
    // короткие касательные осевые у отверстий
    line(cx + hy, cy - rh - 2, cx + hy, cy + rh + 2),
    line(cx - hy, cy - rh - 2, cx - hy, cy + rh + 2),
    line(cx - rh - 2, cy - hy, cx + rh + 2, cy - hy),
    line(cx - rh - 2, cy + hy, cx + rh + 2, cy + hy),
  ].join('');

  const d = std.diam;
  const k = Math.SQRT1_2;
  const dims = [
    // отверстия: выноска от верхнего отверстия вправо-вверх
    leader(cx + rh * k, cy - hy - rh * k, cx + 18, 14, cx + 48, std.holes(`${d}${fmt(std, PART.holeD)}`)),
    // окружность центров: выноска влево-вверх
    leader(cx - hy * k, cy - hy * k, cx - 42, 18, cx - 58, `${d}${fmt(std, PART.pcd)}`),
  ].join('');

  return { visible, hidden: '', center, hatch: '', dims };
}

/* Знак метода проецирования (ISO 5456-2): усечённый конус и две окружности. */
function projectionSymbol(x, y, method) {
  const cone = (ox) =>
    `<polygon points="${ox},${y - 2} ${ox + 9},${y - 4} ${ox + 9},${y + 4} ${ox},${y + 2}" class="ts-thin"/>` +
    line(ox - 1, y, ox + 10, y, ' class="ts-axis"');
  const rings = (cx) =>
    circle(cx, y, 4, ' class="ts-thin"') + circle(cx, y, 2, ' class="ts-thin"') +
    line(cx - 5, y, cx + 5, y, ' class="ts-axis"') + line(cx, y - 5, cx, y + 5, ' class="ts-axis"');
  return method === 'first' ? cone(x) + rings(x + 16) : rings(x + 4) + cone(x + 11);
}

function gostBlock() {
  const x = 107, y = 150, w = 185, h = 55;
  const thick = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`,
    line(172, y, 172, y + h),
    line(114, y, 114, 175), line(124, y, 124, y + h), line(147, y, 147, y + h), line(162, y, 162, y + h),
    line(x, 175, 172, 175),
    line(172, 165, 292, 165), line(172, 190, 292, 190),
    line(242, 165, 242, 205),
    line(242, 185, 292, 185),
    line(257, 165, 257, 185), line(274, 165, 274, 185),
  ].join('');
  const thin = [
    ...[155, 160, 165, 170, 180, 185, 190, 195, 200].map((yy) => line(x, yy, 172, yy)),
    line(242, 170, 292, 170),
    line(267, 185, 267, 190),
  ].join('');
  const t = [
    text(110.5, 174, 'Изм.', { size: 2.2 }), text(119, 174, 'Лист', { size: 2.2 }),
    text(135.5, 174, '№ докум.', { size: 2.2 }), text(154.5, 174, 'Подп.', { size: 2.2 }), text(167, 174, 'Дата', { size: 2.2 }),
    text(108, 179, 'Разраб.', { size: 2.2, anchor: 'start' }), text(125, 179, 'Киричук', { size: 2.2, anchor: 'start' }),
    text(167, 179, '29.10.26', { size: 1.9 }),
    text(108, 184, 'Пров.', { size: 2.2, anchor: 'start' }),
    text(108, 189, 'Т.контр.', { size: 2.2, anchor: 'start' }),
    text(108, 199, 'Н.контр.', { size: 2.2, anchor: 'start' }),
    text(108, 204, 'Утв.', { size: 2.2, anchor: 'start' }),
    text(232, 160, 'SGW.01.001', { size: 6 }),
    text(207, 180, 'Фланец', { size: 6 }),
    text(249.5, 169, 'Лит.', { size: 2.2 }), text(265.5, 169, 'Масса', { size: 2.2 }), text(283, 169, 'Масштаб', { size: 2.2 }),
    text(249.5, 179.5, 'У', { size: 3.5 }), text(265.5, 179.5, fmtMass('GOST'), { size: 3.5 }), text(283, 179.5, '1:1', { size: 3.5 }),
    text(254.5, 189, 'Лист 1', { size: 2.2 }), text(279.5, 189, 'Листов 1', { size: 2.2 }),
    text(207, 199.5, 'Сталь 45 ГОСТ 1050–2013', { size: 3.5 }),
    text(267, 199.5, 'МФТИ', { size: 3.5 }),
  ].join('');
  return { thick, thin, text: t };
}

function isoBlock() {
  const x = 112, y = 176, w = 180, h = 29;
  const thick = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`,
    line(x, 185, 292, 185),
    line(157, y, 157, y + h), line(202, y, 202, 185), line(247, 185, 247, y + h),
  ].join('');
  const thin = [line(247, 195, 292, 195), line(262, 195, 262, 205), line(277, 195, 277, 205)].join('');
  const lbl = (xx, yy, s) => text(xx, yy, s, { size: 1.8, anchor: 'start' });
  const t = [
    lbl(113, 178.5, 'Created by'), text(113, 183.3, 'V. Kirichuk', { size: 2.8, anchor: 'start' }),
    lbl(158, 178.5, 'Approved by'), text(158, 183.3, '—', { size: 2.8, anchor: 'start' }),
    lbl(203, 178.5, 'Document type'), text(203, 183.3, 'Detail drawing', { size: 2.8, anchor: 'start' }),
    text(113, 191, 'Sheetgen Web', { size: 3.2, anchor: 'start', weight: 600 }),
    lbl(158, 187.5, 'Title'), text(202, 197.5, 'Flange', { size: 5.5 }),
    lbl(248, 187.5, 'Drawing no.'), text(248, 193, 'SGW-001', { size: 3.2, anchor: 'start' }),
    lbl(248, 197.5, 'Rev.'), text(254.5, 203.5, 'A', { size: 3 }),
    lbl(263, 197.5, 'Scale'), text(269.5, 203.5, '1:1', { size: 3 }),
    lbl(278, 197.5, 'Size'), text(284.5, 203.5, 'A4', { size: 3 }),
  ].join('');
  return { thick, thin, text: t, symbol: projectionSymbol(118, 199, 'first') };
}

function asmeBlock() {
  const x = 122, y = 173, w = 170, h = 32;
  const thick = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`,
    line(182, y, 182, y + h),
    line(182, 183, 292, 183), line(182, 193, 292, 193), line(182, 200, 292, 200),
    line(197, 193, 197, 200), line(272, 193, 272, 200),
    line(222, 200, 222, 205), line(262, 200, 262, 205),
  ].join('');
  const lbl = (xx, yy, s) => text(xx, yy, s, { size: 1.7, anchor: 'start' });
  const t = [
    text(124, 177, 'UNLESS OTHERWISE SPECIFIED:', { size: 1.9, anchor: 'start' }),
    text(124, 180, 'DIMENSIONS ARE IN INCHES', { size: 1.9, anchor: 'start' }),
    text(124, 183, 'TOLERANCES: .XX ±.01  .XXX ±.005', { size: 1.9, anchor: 'start' }),
    text(152, 203.5, 'THIRD ANGLE PROJECTION', { size: 1.7 }),
    text(237, 180, 'SHEETGEN WEB', { size: 4, weight: 600 }),
    text(237, 190.5, 'FLANGE', { size: 4.5 }),
    lbl(183.5, 186, 'TITLE:'),
    lbl(183, 195.5, 'SIZE'), text(189.5, 199.2, 'A4', { size: 2.6 }),
    lbl(198, 195.5, 'DWG. NO.'), text(234.5, 199.2, 'SGW-001', { size: 2.6 }),
    lbl(273, 195.5, 'REV'), text(282, 199.2, 'A', { size: 2.6 }),
    text(202, 203.8, 'SCALE 1:1', { size: 2 }),
    text(242, 203.8, `WEIGHT ${fmtMass('ASME')}`, { size: 2 }),
    text(277, 203.8, 'SHEET 1 OF 1', { size: 2 }),
  ].join('');
  return { thick, thin: '', text: t, symbol: projectionSymbol(140, 192, 'third') };
}

function fmtMass(key) {
  if (key === 'ASME') return `${(PART.massKg * 2.20462).toFixed(2)} lb`;
  if (key === 'ISO') return `${PART.massKg} kg`;
  return String(PART.massKg).replace('.', ',');
}

/* Раскладка видов: первый угол — вид со стороны ступицы справа, третий угол — слева. */
const LAYOUT = {
  first: { frontX: 62, sideX: 200 },
  third: { frontX: 195, sideX: 90 },
};

export function dimensionCount() {
  return 7;
}

/* pathLength="1" нужен для анимации прорисовки контура. */
function withPathLength(markup) {
  return markup.replace(/<(line|circle) /g, '<$1 pathLength="1" ');
}

/**
 * Собирает SVG листа.
 * @param {'GOST'|'ISO'|'ASME'} key стандарт
 * @param {Record<string, boolean>} layers видимость слоёв
 * @param {{ forExport?: boolean }} opts при экспорте выключенные слои вырезаются, а стили встраиваются
 */
export function buildSheet(key, layers, opts = {}) {
  const std = STANDARDS[key];
  const lay = LAYOUT[std.projection];
  const y0 = 80;
  const fv = frontView(std, lay.frontX, y0);
  const sv = sideView(std, lay.sideX, y0);
  const block = std.titleBlock === 'gost' ? gostBlock() : std.titleBlock === 'iso' ? isoBlock() : asmeBlock();

  const on = (name) => layers[name] !== false;
  const group = (name, content) => {
    if (opts.forExport && !on(name)) return '';
    const hidden = !on(name) ? ' style="display:none"' : '';
    return `<g class="l-${name}" data-layer="${name}"${hidden}>${content}</g>`;
  };

  const style = `
    .frame, .tb-thick { fill: none; stroke: #1b1d20; stroke-width: 0.6; }
    .tb-thin { fill: none; stroke: #1b1d20; stroke-width: 0.25; }
    .l-visible { fill: none; stroke: #1b1d20; stroke-width: 0.6; stroke-linecap: round; }
    .l-hidden { fill: none; stroke: #1b1d20; stroke-width: 0.3; stroke-dasharray: 3 1.5; }
    .l-center { fill: none; stroke: #1b1d20; stroke-width: 0.25; stroke-dasharray: 9 1.5 1 1.5; }
    .l-dims line { stroke: #1b1d20; stroke-width: 0.25; }
    .l-dims polygon { fill: #1b1d20; stroke: none; }
    .l-hatch polygon { fill: url(#hatch); stroke: none; }
    .ts-thin { fill: none; stroke: #1b1d20; stroke-width: 0.3; }
    .ts-axis { stroke: #1b1d20; stroke-width: 0.2; stroke-dasharray: 3 0.8 0.6 0.8; }
    text { fill: #1b1d20; }`;

  const fontStyle = std.italic ? ' font-style="italic"' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" width="297mm" height="210mm" role="img" aria-labelledby="sheet-title sheet-desc" class="sheet-svg" data-standard="${key}">
<title id="sheet-title">Чертёж фланца, ${std.label}</title>
<desc id="sheet-desc">Лист A4: главный вид фланца в полувиде-полуразрезе, вид со стороны ступицы с четырьмя отверстиями, размеры и основная надпись по ${std.label}.</desc>
<defs>
  <pattern id="hatch" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="2" stroke="#1b1d20" stroke-width="0.2"/>
  </pattern>
  <style>${style}</style>
</defs>
<rect width="297" height="210" fill="#ffffff"/>
<rect x="0.5" y="0.5" width="296" height="209" class="tb-thin"/>
<rect x="20" y="5" width="272" height="200" class="frame"/>
<g font-family="${std.font}"${fontStyle}>
  ${group('hatch', fv.hatch)}
  ${group('hidden', fv.hidden)}
  ${group('center', fv.center + sv.center)}
  ${group('visible', withPathLength(fv.visible + sv.visible))}
  ${group('dims', fv.dims + sv.dims)}
  <g class="tb-thick">${block.thick}</g>
  <g class="tb-thin">${block.thin}</g>
  ${block.symbol || ''}
  <g class="tb-text">${block.text}</g>
</g>
</svg>`;
}
