/**
 * SETUP settings (User's Guide "Configuring the Calculator Setup").
 * "◆" defaults from the guide. Contrast is kept by RESET → Setup Data.
 */

export const IO_MODES = ['MathI/MathO', 'MathI/DecimalO', 'LineI/LineO', 'LineI/DecimalO'];

export function defaultSetup() {
  return {
    inputOutput: 'MathI/MathO',
    angle: 'DEG', // DEG | RAD | GRA
    numberFormat: { type: 'NORM', value: 1 }, // NORM 1|2, FIX 0–9, SCI 0–9 (0 = 10 digits)
    engSymbol: false,
    fraction: 'IMPROPER', // IMPROPER (d/c) | MIXED (ab/c)
    complex: 'RECT', // RECT (a+bi) | POLAR (r∠θ)
    statFreq: false,
    autoCalc: true,
    showCell: 'FORMULA', // FORMULA | VALUE
    eqComplex: true, // Equation/Func: complex roots On
    table: 'F', // F (f(x)) | FG (f(x),g(x))
    decimalMark: 'DOT', // DOT | COMMA
    digitSeparator: false,
    multiLineFont: 'NORMAL', // NORMAL | SMALL
    qrVersion: 11, // 3 | 11
    contrast: 8, // 0–15
    autoPowerOff: 10 // 10 | 60 (minutes)
  };
}

export const isMathInput = (s) => s.inputOutput.startsWith('MathI');
export const isDecimalOutput = (s) => s.inputOutput.endsWith('DecimalO');

/** Options for formatNumber / display trees. */
export function formatOptions(s, extra = {}) {
  const nf = s.numberFormat;
  const format = nf.type === 'SCI' ? { type: 'SCI', value: nf.value === 0 ? 10 : nf.value } : nf;
  return {
    numberFormat: format,
    engSymbols: s.engSymbol,
    decimalMark: s.decimalMark,
    digitSeparator: s.digitSeparator,
    ...extra
  };
}

/** Apply the shorthand setup object used by golden tests. */
export function applySetupShorthand(setup, o = {}) {
  if (o.inputOutput) setup.inputOutput = o.inputOutput;
  if (o.display) {
    const d = String(o.display).toLowerCase();
    if (d.includes('lineo') && d.includes('mth')) setup.inputOutput = 'MathI/DecimalO';
    else if (d.includes('lineio') || d === 'line') setup.inputOutput = 'LineI/LineO';
    else setup.inputOutput = 'MathI/MathO';
  }
  if (o.angle) {
    const a = String(o.angle).toUpperCase();
    setup.angle = a.startsWith('RAD') ? 'RAD' : a.startsWith('GRA') ? 'GRA' : 'DEG';
  }
  if (o.format) {
    const f = String(o.format);
    const m = f.match(/^(Norm|Fix|Sci)\s*(\d+)?$/i);
    if (m) {
      const type = m[1].toUpperCase();
      const val = m[2] !== undefined ? Number(m[2]) : (type === 'NORM' ? 1 : 0);
      setup.numberFormat = { type, value: val };
    }
  }
  if (o.numberFormat) {
    const nf = o.numberFormat;
    const t = String(nf.type || 'NORM').toUpperCase();
    if (t.startsWith('NORM')) setup.numberFormat = { type: 'NORM', value: nf.value ?? (t === 'NORM2' ? 2 : 1) };
    else setup.numberFormat = { type: t, value: nf.value ?? nf.digits ?? 0 };
  }
  if (o.fraction) setup.fraction = String(o.fraction).toUpperCase().startsWith('MIX') || o.fraction === 'ab/c' ? 'MIXED' : 'IMPROPER';
  if (o.engSymbol !== undefined) setup.engSymbol = !!o.engSymbol;
  if (o.complex) setup.complex = String(o.complex).toUpperCase().startsWith('POL') || o.complex.includes('∠') ? 'POLAR' : 'RECT';
  if (o.statFreq !== undefined) setup.statFreq = !!o.statFreq;
  if (o.table) setup.table = o.table === 'F' ? 'F' : 'FG';
  if (o.decimalMark) setup.decimalMark = String(o.decimalMark).toUpperCase();
  if (o.digitSeparator !== undefined) setup.digitSeparator = !!o.digitSeparator;
  if (o.eqComplex !== undefined) setup.eqComplex = !!o.eqComplex;
  if (o.autoCalc !== undefined) setup.autoCalc = !!o.autoCalc;
  if (o.contrast !== undefined) setup.contrast = Math.max(0, Math.min(15, Number(o.contrast) || 8));
  if (o.autoPowerOff !== undefined) setup.autoPowerOff = Number(o.autoPowerOff) === 60 ? 60 : 10;
  return setup;
}
