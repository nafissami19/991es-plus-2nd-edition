/**
 * Calculator errors for Casio fx-991ES PLUS 2nd edition.
 * Exact 9 error messages per specs:
 *   Math ERROR, Stack ERROR, Syntax ERROR, Argument ERROR,
 *   Dimension ERROR, Variable ERROR, Can't Solve, Insufficient MEM, Time Out.
 * `loc` (optional) is the editor location the cursor jumps to with ◀/▶.
 */

export const ERRORS = {
  MATH: 'Math ERROR',
  STACK: 'Stack ERROR',
  SYNTAX: 'Syntax ERROR',
  ARGUMENT: 'Argument ERROR',
  DIMENSION: 'Dimension ERROR',
  VARIABLE: 'Variable ERROR',
  CANT_SOLVE: "Can't Solve",
  CANNOT_SOLVE: "Can't Solve",
  INSUFFICIENT_MEM: 'Insufficient MEM',
  MEMORY: 'Insufficient MEM',
  TIME_OUT: 'Time Out'
};

const KNOWN = new Set(Object.values(ERRORS));

/** Errors that offer [◀][▶]:Goto on the error screen (the rest only offer [AC]:Cancel). */
export const GOTO_ERRORS = new Set([
  ERRORS.MATH,
  ERRORS.STACK,
  ERRORS.SYNTAX,
  ERRORS.ARGUMENT,
  ERRORS.DIMENSION,
  ERRORS.VARIABLE
]);

export class CalcError extends Error {
  constructor(message = ERRORS.MATH, details = {}) {
    if (message === 'Cannot Solve') message = ERRORS.CANT_SOLVE;
    if (message === 'Memory ERROR') message = ERRORS.INSUFFICIENT_MEM;
    super(message);
    this.name = 'CalcError';
    this.errorType = message;
    this.details = details;
    this.loc = details.loc || null;
  }

  withLoc(loc) {
    if (!this.loc && loc) this.loc = loc;
    return this;
  }
}

/** Convert anything thrown during a calculation into a CalcError. */
export function toCalcError(err, loc = null) {
  if (err instanceof CalcError) return err.withLoc(loc);
  const msg = err && err.message ? err.message : '';
  if (msg.includes("Can't Solve") || msg.includes('Cannot Solve')) return new CalcError(ERRORS.CANT_SOLVE, { loc });
  if (msg.includes('Insufficient MEM') || msg.includes('Memory ERROR')) return new CalcError(ERRORS.INSUFFICIENT_MEM, { loc });
  if (msg.includes('Time Out')) return new CalcError(ERRORS.TIME_OUT, { loc });
  for (const known of KNOWN) {
    if (msg.includes(known)) return new CalcError(known, { loc });
  }
  if (err instanceof RangeError) return new CalcError(ERRORS.MATH, { loc });
  return new CalcError(ERRORS.MATH, { loc, cause: msg });
}
