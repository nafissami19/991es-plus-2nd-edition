/**
 * Metric conversions (SHIFT 8 CONV) — 40 commands, NIST SP 811 (2008) factors.
 * A conversion is a postfix command with priority 6 ("5 cm▸in").
 */

import { registerToken } from '../input/tokens.js';
import { ExactValue } from '../exact/ExactValue.js';

function dec(s) {
  const [ip, fp = ''] = s.split('.');
  return ExactValue.fromRational(BigInt(ip + fp), 10n ** BigInt(fp.length));
}

export const CONVERSION_LIST = [
  // 01–02: in ⇄ cm
  { from: 'in', to: 'cm', fn: (x) => x.mul(dec('2.54')) },
  { from: 'cm', to: 'in', fn: (x) => x.div(dec('2.54')) },
  // 03–04: ft ⇄ m
  { from: 'ft', to: 'm', fn: (x) => x.mul(dec('0.3048')) },
  { from: 'm', to: 'ft', fn: (x) => x.div(dec('0.3048')) },
  // 05–06: yd ⇄ m
  { from: 'yd', to: 'm', fn: (x) => x.mul(dec('0.9144')) },
  { from: 'm', to: 'yd', fn: (x) => x.div(dec('0.9144')) },
  // 07–08: mile ⇄ km
  { from: 'mile', to: 'km', fn: (x) => x.mul(dec('1.609344')) },
  { from: 'km', to: 'mile', fn: (x) => x.div(dec('1.609344')) },
  // 09–10: n mile ⇄ m
  { from: 'n mile', to: 'm', fn: (x) => x.mul(dec('1852')) },
  { from: 'm', to: 'n mile', fn: (x) => x.div(dec('1852')) },
  // 11–12: acre ⇄ m²
  { from: 'acre', to: 'm²', fn: (x) => x.mul(dec('4046.8564224')) },
  { from: 'm²', to: 'acre', fn: (x) => x.div(dec('4046.8564224')) },
  // 13–14: gal(US) ⇄ L
  { from: 'gal(US)', to: 'L', fn: (x) => x.mul(dec('3.785411784')) },
  { from: 'L', to: 'gal(US)', fn: (x) => x.div(dec('3.785411784')) },
  // 15–16: gal(UK) ⇄ L
  { from: 'gal(UK)', to: 'L', fn: (x) => x.mul(dec('4.54609')) },
  { from: 'L', to: 'gal(UK)', fn: (x) => x.div(dec('4.54609')) },
  // 17–18: pc ⇄ km
  { from: 'pc', to: 'km', fn: (x) => x.mul(dec('30856775814913.7')) },
  { from: 'km', to: 'pc', fn: (x) => x.div(dec('30856775814913.7')) },
  // 19–20: km/h ⇄ m/s
  { from: 'km/h', to: 'm/s', fn: (x) => x.div(ExactValue.fromRational(18n, 5n)) },
  { from: 'm/s', to: 'km/h', fn: (x) => x.mul(ExactValue.fromRational(18n, 5n)) },
  // 21–22: oz ⇄ g
  { from: 'oz', to: 'g', fn: (x) => x.mul(dec('28.349523125')) },
  { from: 'g', to: 'oz', fn: (x) => x.div(dec('28.349523125')) },
  // 23–24: lb ⇄ kg
  { from: 'lb', to: 'kg', fn: (x) => x.mul(dec('0.45359237')) },
  { from: 'kg', to: 'lb', fn: (x) => x.div(dec('0.45359237')) },
  // 25–26: atm ⇄ Pa
  { from: 'atm', to: 'Pa', fn: (x) => x.mul(dec('101325')) },
  { from: 'Pa', to: 'atm', fn: (x) => x.div(dec('101325')) },
  // 27–28: mmHg ⇄ Pa
  { from: 'mmHg', to: 'Pa', fn: (x) => x.mul(dec('133.322')) },
  { from: 'Pa', to: 'mmHg', fn: (x) => x.div(dec('133.322')) },
  // 29–30: hp ⇄ kW
  { from: 'hp', to: 'kW', fn: (x) => x.mul(dec('0.74569987158227')) },
  { from: 'kW', to: 'hp', fn: (x) => x.div(dec('0.74569987158227')) },
  // 31–32: kgf/cm² ⇄ Pa
  { from: 'kgf/cm²', to: 'Pa', fn: (x) => x.mul(dec('98066.5')) },
  { from: 'Pa', to: 'kgf/cm²', fn: (x) => x.div(dec('98066.5')) },
  // 33–34: kgf·m ⇄ J
  { from: 'kgf·m', to: 'J', fn: (x) => x.mul(dec('9.80665')) },
  { from: 'J', to: 'kgf·m', fn: (x) => x.div(dec('9.80665')) },
  // 35–36: lbf/in² ⇄ kPa
  { from: 'lbf/in²', to: 'kPa', fn: (x) => x.mul(dec('6.894757293168')) },
  { from: 'kPa', to: 'lbf/in²', fn: (x) => x.div(dec('6.894757293168')) },
  // 37–38: °F ⇄ °C
  { from: '°F', to: '°C', fn: (x) => x.sub(ExactValue.fromInt(32n)).mul(ExactValue.fromRational(5n, 9n)) },
  { from: '°C', to: '°F', fn: (x) => x.mul(ExactValue.fromRational(9n, 5n)).add(ExactValue.fromInt(32n)) },
  // 39–40: J ⇄ cal
  { from: 'J', to: 'cal', fn: (x) => x.div(dec('4.1855')) },
  { from: 'cal', to: 'J', fn: (x) => x.mul(dec('4.1855')) }
];

export const CONVERSION_IDS = [];
export const CONVERSION_BY_INDEX = (num) => CONVERSION_IDS[num - 1];

for (let i = 0; i < CONVERSION_LIST.length; i++) {
  const item = CONVERSION_LIST[i];
  const id = `conv_${i + 1}`;
  const label = `${item.from}▸${item.to}`;
  registerToken(id, label, 'post', 2, { op: 'conv', prec: 65, convert: item.fn });
  CONVERSION_IDS.push(id);
}
