/**
 * Statistical calculation screen for Mode 3: Statistics on fx-991ES PLUS 2nd edition.
 */

import { CalcApp } from '../../apps/CalcApp.js';
import { ResultView } from '../../format/ResultView.js';
import { ExactValue } from '../../exact/ExactValue.js';
import { Decimal15 } from '../../number/Decimal15.js';
import { CalcError, ERRORS } from '../../errors.js';
import { STAT_TYPES } from './StatModel.js';
import './tokens.js';

export class StatCalcMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calcApp) {
    this.calcApp = calcApp;
    this.calc = calcApp.calc;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === '1') {
      this.calc.closeAllOverlays();
      this.calcApp.statApp.showSelectType();
      return true;
    }
    if (k === '2') {
      this.calc.closeAllOverlays();
      this.calcApp.statApp.showEditor();
      return true;
    }
    if (k === '3') {
      this.calc.replaceView(new StatSumMenuView(this.calcApp));
      return true;
    }
    if (k === '4') {
      this.calc.replaceView(new StatVarMenuView(this.calcApp));
      return true;
    }
    if (k === '5') {
      if (!this.calcApp.model.isPaired()) {
        this.calc.replaceView(new StatDistrMenuView(this.calcApp));
      } else {
        this.calc.replaceView(new StatRegMenuView(this.calcApp));
      }
      return true;
    }
    if (k === '6') {
      this.calc.replaceView(new StatMinMaxMenuView(this.calcApp));
      return true;
    }
    return true;
  }

  indicators(set) {
  }

  render(scr) {
    scr.clear();
    const isPaired = this.calcApp.model.isPaired();
    const opt5 = isPaired ? '5:Reg' : '5:Distr';
    scr.text(0, 1, '1:Type', { font: 'small' });
    scr.text(48, 1, '2:Data', { font: 'small' });
    scr.text(0, 9, '3:Sum', { font: 'small' });
    scr.text(48, 9, '4:Var', { font: 'small' });
    scr.text(0, 17, opt5, { font: 'small' });
    scr.text(48, 17, '6:MinMax', { font: 'small' });
    scr.lines = [
      '1:Type    2:Data',
      '3:Sum     4:Var',
      `${opt5}   6:MinMax`
    ];
  }
}

export class StatSumMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calcApp) {
    this.calcApp = calcApp;
    this.calc = calcApp.calc;
    this.page = 0;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    const isPaired = this.calcApp.model.isPaired();
    if (isPaired) {
      if (k === 'DOWN') {
        this.page = 1;
        return true;
      }
      if (k === 'UP') {
        this.page = 0;
        return true;
      }
    }
    const ins = (id) => {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: id }, false);
    };

    if (!isPaired) {
      if (k === '1') { ins('stat_sum_x2'); return true; }
      if (k === '2') { ins('stat_sum_x'); return true; }
    } else {
      if (this.page === 0) {
        if (k === '1') { ins('stat_sum_x2'); return true; }
        if (k === '2') { ins('stat_sum_x'); return true; }
        if (k === '3') { ins('stat_sum_y2'); return true; }
        if (k === '4') { ins('stat_sum_y'); return true; }
      } else {
        if (k === '1') { ins('stat_sum_xy'); return true; }
        if (k === '2') { ins('stat_sum_x3'); return true; }
        if (k === '3') { ins('stat_sum_x2y'); return true; }
        if (k === '4') { ins('stat_sum_x4'); return true; }
      }
    }
    return true;
  }

  indicators(set) {
    if (this.calcApp.model.isPaired()) {
      if (this.page === 0) set.add('Down');
      else set.add('Up');
    }
  }

  render(scr) {
    scr.clear();
    const isPaired = this.calcApp.model.isPaired();
    if (!isPaired) {
      scr.text(0, 1, '1:\u03A3x\u00B2', { font: 'small' });
      scr.text(48, 1, '2:\u03A3x', { font: 'small' });
      scr.lines = ['1:Σx²     2:Σx'];
    } else {
      if (this.page === 0) {
        scr.text(0, 1, '1:\u03A3x\u00B2', { font: 'small' });
        scr.text(48, 1, '2:\u03A3x', { font: 'small' });
        scr.text(0, 9, '3:\u03A3y\u00B2', { font: 'small' });
        scr.text(48, 9, '4:\u03A3y', { font: 'small' });
        scr.lines = [
          '1:Σx²     2:Σx',
          '3:Σy²     4:Σy'
        ];
      } else {
        scr.text(0, 1, '1:\u03A3xy', { font: 'small' });
        scr.text(48, 1, '2:\u03A3x\u00B3', { font: 'small' });
        scr.text(0, 9, '3:\u03A3x\u00B2y', { font: 'small' });
        scr.text(48, 9, '4:\u03A3x\u2074', { font: 'small' });
        scr.lines = [
          '1:Σxy    2:Σx³',
          '3:Σx²y   4:Σx⁴'
        ];
      }
    }
  }
}

export class StatVarMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calcApp) {
    this.calcApp = calcApp;
    this.calc = calcApp.calc;
    this.page = 0;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    const isPaired = this.calcApp.model.isPaired();
    if (isPaired) {
      if (k === 'DOWN') {
        this.page = 1;
        return true;
      }
      if (k === 'UP') {
        this.page = 0;
        return true;
      }
    }
    const ins = (id) => {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: id }, false);
    };

    if (!isPaired || this.page === 0) {
      if (k === '1') { ins('stat_n'); return true; }
      if (k === '2') { ins('stat_mean_x'); return true; }
      if (k === '3') { ins('stat_sd_pop_x'); return true; }
      if (k === '4') { ins('stat_sd_sample_x'); return true; }
    } else {
      if (k === '1') { ins('stat_mean_y'); return true; }
      if (k === '2') { ins('stat_sd_pop_y'); return true; }
      if (k === '3') { ins('stat_sd_sample_y'); return true; }
    }
    return true;
  }

  indicators(set) {
    if (this.calcApp.model.isPaired()) {
      if (this.page === 0) set.add('Down');
      else set.add('Up');
    }
  }

  render(scr) {
    scr.clear();
    const isPaired = this.calcApp.model.isPaired();
    if (!isPaired || this.page === 0) {
      scr.text(0, 1, '1:n', { font: 'small' });
      scr.text(48, 1, '2:x\u0304', { font: 'small' });
      scr.text(0, 9, '3:\u03C3x', { font: 'small' });
      scr.text(48, 9, '4:sx', { font: 'small' });
      scr.lines = [
        '1:n       2:x̄',
        '3:σx      4:sx'
      ];
    } else {
      scr.text(0, 1, '1:y\u0304', { font: 'small' });
      scr.text(48, 1, '2:\u03C3y', { font: 'small' });
      scr.text(0, 9, '3:sy', { font: 'small' });
      scr.lines = [
        '1:ȳ       2:σy',
        '3:sy'
      ];
    }
  }
}

export class StatDistrMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calcApp) {
    this.calcApp = calcApp;
    this.calc = calcApp.calc;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === '1') {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: 'Pdist' }, false);
      return true;
    }
    if (k === '2') {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: 'Qdist' }, false);
      return true;
    }
    if (k === '3') {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: 'Rdist' }, false);
      return true;
    }
    if (k === '4') {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: 'tnorm' }, true);
      return true;
    }
    return true;
  }

  indicators(set) {
  }

  render(scr) {
    scr.clear();
    scr.text(0, 1, '1:P(', { font: 'small' });
    scr.text(48, 1, '2:Q(', { font: 'small' });
    scr.text(0, 9, '3:R(', { font: 'small' });
    scr.text(48, 9, '4:\u25B8t', { font: 'small' });
    scr.lines = [
      '1:P(      2:Q(',
      '3:R(      4:▸t'
    ];
  }
}

export class StatRegMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calcApp) {
    this.calcApp = calcApp;
    this.calc = calcApp.calc;
    this.page = 0;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    if (k === 'DOWN') {
      this.page = 1;
      return true;
    }
    if (k === 'UP') {
      this.page = 0;
      return true;
    }

    const ins = (id, post = false) => {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: id }, post);
    };

    const isQuad = this.calcApp.model.type === STAT_TYPES.QUADRATIC;
    if (!isQuad) {
      if (k === '1' && this.page === 0) { ins('stat_a'); return true; }
      if (k === '1' && this.page === 1) { ins('yhat', true); return true; }
      if (k === '2') { ins('stat_b'); return true; }
      if (k === '3') { ins('stat_r'); return true; }
      if (k === '4') { ins('xhat', true); return true; }
      if (k === '5') { ins('yhat', true); return true; }
    } else {
      if (k === '1' && this.page === 0) { ins('stat_a'); return true; }
      if (k === '1' && this.page === 1) { ins('xhat2', true); return true; }
      if (k === '2' && this.page === 0) { ins('stat_b'); return true; }
      if (k === '2' && this.page === 1) { ins('yhat', true); return true; }
      if (k === '3') { ins('stat_c'); return true; }
      if (k === '4') { ins('xhat1', true); return true; }
      if (k === '5') { ins('xhat2', true); return true; }
      if (k === '6') { ins('yhat', true); return true; }
    }
    return true;
  }

  indicators(set) {
    if (this.page === 0) set.add('Down');
    else set.add('Up');
  }

  render(scr) {
    scr.clear();
    const isQuad = this.calcApp.model.type === STAT_TYPES.QUADRATIC;
    if (!isQuad) {
      if (this.page === 0) {
        scr.text(0, 1, '1:A', { font: 'small' });
        scr.text(48, 1, '2:B', { font: 'small' });
        scr.text(0, 9, '3:r', { font: 'small' });
        scr.text(48, 9, '4:x\u0302', { font: 'small' });
        scr.lines = [
          '1:A       2:B',
          '3:r       4:x̂'
        ];
      } else {
        scr.text(0, 1, '1:y\u0302', { font: 'small' });
        scr.lines = ['1:ŷ'];
      }
    } else {
      if (this.page === 0) {
        scr.text(0, 1, '1:A', { font: 'small' });
        scr.text(48, 1, '2:B', { font: 'small' });
        scr.text(0, 9, '3:C', { font: 'small' });
        scr.text(48, 9, '4:x\u0302\u2081', { font: 'small' });
        scr.lines = [
          '1:A       2:B',
          '3:C       4:x̂₁'
        ];
      } else {
        scr.text(0, 1, '1:x\u0302\u2082', { font: 'small' });
        scr.text(48, 1, '2:y\u0302', { font: 'small' });
        scr.lines = [
          '1:x̂₂      2:ŷ'
        ];
      }
    }
  }
}

export class StatMinMaxMenuView {
  menuScreen = true; // official screen shows no status icons (User's Guide captures)

  constructor(calcApp) {
    this.calcApp = calcApp;
    this.calc = calcApp.calc;
    this.isOverlay = true;
  }

  onKey(ev) {
    if (ev.shift || ev.alpha) return false;
    const k = ev.key;
    if (k === 'AC') {
      this.calc.closeAllOverlays();
      return true;
    }
    const ins = (id) => {
      this.calc.closeAllOverlays();
      this.calcApp.insertInput({ tok: id }, false);
    };

    const isPaired = this.calcApp.model.isPaired();
    if (!isPaired) {
      if (k === '1') { ins('stat_min_x'); return true; }
      if (k === '2') { ins('stat_max_x'); return true; }
    } else {
      if (k === '1') { ins('stat_min_x'); return true; }
      if (k === '2') { ins('stat_max_x'); return true; }
      if (k === '3') { ins('stat_min_y'); return true; }
      if (k === '4') { ins('stat_max_y'); return true; }
    }
    return true;
  }

  indicators(set) {
  }

  render(scr) {
    scr.clear();
    const isPaired = this.calcApp.model.isPaired();
    if (!isPaired) {
      scr.text(0, 1, '1:minX', { font: 'small' });
      scr.text(48, 1, '2:maxX', { font: 'small' });
      scr.lines = ['1:minX    2:maxX'];
    } else {
      scr.text(0, 1, '1:minX', { font: 'small' });
      scr.text(48, 1, '2:maxX', { font: 'small' });
      scr.text(0, 9, '3:minY', { font: 'small' });
      scr.text(48, 9, '4:maxY', { font: 'small' });
      scr.lines = [
        '1:minX    2:maxX',
        '3:minY    4:maxY'
      ];
    }
  }
}

export class StatCalcApp extends CalcApp {
  constructor(app) {
    super(app.calc);
    this.statApp = app;
    this.title = 'Statistics';
  }

  get model() {
    return this.statApp.model;
  }

  openStatMenu() {
    this.calc.pushView(new StatCalcMenuView(this));
  }

  onKey(ev) {
    if (ev.shift && ev.key === '1') {
      this.openStatMenu();
      return true;
    }
    if (ev.key === 'OPTN') {
      return true;
    }
    return super.onKey(ev);
  }

  makeResultView(value, flags) {
    return new ResultView(value, this.setup, { ...flags, forceDecimal: true });
  }

  evaluatorContext() {
    const ctx = super.evaluatorContext();
    const model = this.model;

    ctx.resolveValue = (n) => {
      const id = n.id;
      if (id === 'stat_mean_x') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.meanX));
      }
      if (id === 'stat_sum_x') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumX));
      }
      if (id === 'stat_sum_x2') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumX2));
      }
      if (id === 'stat_var_pop_x') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.varPopX));
      }
      if (id === 'stat_sd_pop_x') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sdPopX));
      }
      if (id === 'stat_var_sample_x') {
        const s = model.calc1Var();
        if (s.varSampleX === null) throw new CalcError(ERRORS.MATH);
        return ExactValue.fromDecimal(Decimal15.from(s.varSampleX));
      }
      if (id === 'stat_sd_sample_x') {
        const s = model.calc1Var();
        if (s.sdSampleX === null) throw new CalcError(ERRORS.MATH);
        return ExactValue.fromDecimal(Decimal15.from(s.sdSampleX));
      }
      if (id === 'stat_n') {
        const s = model.calc1Var();
        return ExactValue.fromInt(BigInt(s.n));
      }
      if (id === 'stat_min_x') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.minX));
      }
      if (id === 'stat_max_x') {
        const s = model.calc1Var();
        return ExactValue.fromDecimal(Decimal15.from(s.maxX));
      }

      // Paired variables
      if (id === 'stat_mean_y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.meanY));
      }
      if (id === 'stat_sum_y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumY));
      }
      if (id === 'stat_sum_y2') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumY2));
      }
      if (id === 'stat_var_pop_y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.varPopY));
      }
      if (id === 'stat_sd_pop_y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sdPopY));
      }
      if (id === 'stat_var_sample_y') {
        const s = model.calc2Var();
        if (s.varSampleY === null) throw new CalcError(ERRORS.MATH);
        return ExactValue.fromDecimal(Decimal15.from(s.varSampleY));
      }
      if (id === 'stat_sd_sample_y') {
        const s = model.calc2Var();
        if (s.sdSampleY === null) throw new CalcError(ERRORS.MATH);
        return ExactValue.fromDecimal(Decimal15.from(s.sdSampleY));
      }
      if (id === 'stat_min_y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.minY));
      }
      if (id === 'stat_max_y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.maxY));
      }
      if (id === 'stat_sum_xy') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumXY));
      }
      if (id === 'stat_sum_x3') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumX3));
      }
      if (id === 'stat_sum_x2y') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumX2Y));
      }
      if (id === 'stat_sum_x4') {
        const s = model.calc2Var();
        return ExactValue.fromDecimal(Decimal15.from(s.sumX4));
      }

      // Regression coefficients
      if (id === 'stat_a') {
        const r = model.calcRegression();
        return ExactValue.fromDecimal(Decimal15.from(r.a));
      }
      if (id === 'stat_b') {
        const r = model.calcRegression();
        return ExactValue.fromDecimal(Decimal15.from(r.b));
      }
      if (id === 'stat_c') {
        const r = model.calcRegression();
        return ExactValue.fromDecimal(Decimal15.from(r.c));
      }
      if (id === 'stat_r') {
        const r = model.calcRegression();
        return ExactValue.fromDecimal(Decimal15.from(r.r));
      }

      return undefined;
    };

    ctx.postfix = (op, a, n) => {
      const num = a.toDecimal15().toNumber();
      if (op === 'yhat') {
        const y = model.estimateY(num);
        return ExactValue.fromDecimal(Decimal15.from(y));
      }
      if (op === 'xhat') {
        const x = model.estimateX(num);
        return ExactValue.fromDecimal(Decimal15.from(x));
      }
      if (op === 'xhat1') {
        const x = model.estimateX1(num);
        return ExactValue.fromDecimal(Decimal15.from(x));
      }
      if (op === 'xhat2') {
        const x = model.estimateX2(num);
        return ExactValue.fromDecimal(Decimal15.from(x));
      }
      if (op === 'tnorm') {
        const t = model.normT(num);
        return ExactValue.fromDecimal(Decimal15.from(t));
      }
      return undefined;
    };

    ctx.call = (fn, args, n, ev) => {
      if (fn === 'normP') {
        const t = args[0].toDecimal15().toNumber();
        return ExactValue.fromDecimal(Decimal15.from(model.normP(t)));
      }
      if (fn === 'normQ') {
        const t = args[0].toDecimal15().toNumber();
        return ExactValue.fromDecimal(Decimal15.from(model.normQ(t)));
      }
      if (fn === 'normR') {
        const t = args[0].toDecimal15().toNumber();
        return ExactValue.fromDecimal(Decimal15.from(model.normR(t)));
      }
      return undefined;
    };

    return ctx;
  }
}
