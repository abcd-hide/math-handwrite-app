import * as math from 'mathjs';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomNonZeroInt = (min, max) => {
  let res = 0;
  while (res === 0) res = getRandomInt(min, max);
  return res;
};

const getUpperLimit = () => {
    const r = Math.random();
    if (r < 0.33) return { tex: 'n', expr: 'n', n: 'n', np1: 'n+1', np2: 'n+2', np3: 'n+3', nm1: 'n-1' };
    if (r < 0.66) return { tex: 'n-1', expr: '(n-1)', n: 'n-1', np1: 'n', np2: 'n+1', np3: 'n+2', nm1: 'n-2' };
    return { tex: 'n+1', expr: '(n+1)', n: 'n+1', np1: 'n+2', np2: 'n+3', np3: 'n+4', nm1: 'n' };
};

const texSigma = (exprTex, upperTex) => String.raw`\sum_{k=1}^{${upperTex}} ${exprTex}`;

const wrapMath = (expr) => {
  const s = String(expr);
  if (s.includes('\\left\\{') || s.includes('\\{')) return String.raw`\left[ ${s} \right]`;
  if (s.includes('\\left(') || s.includes('(')) return String.raw`\left\{ ${s} \right\}`;
  return String.raw`\left( ${s} \right)`;
};

const fmtFrac = (num, den) => {
  if (den === 1) return `${num}`;
  if (num === 0) return `0`;
  const g = (a, b) => b === 0 ? Math.abs(a) : g(b, a % b);
  const common = g(num, den);
  const n = num / common;
  const d = den / common;
  if (d === 1) return `${n}`;
  const sign = (n * d < 0) ? '-' : '';
  return String.raw`${sign}\frac{${Math.abs(n)}}{${Math.abs(d)}}`;
};

export const sequenceSumGenerators = {
  // レベル1: 等差数列・等比数列の和
  level1: () => {
    const isArithmetic = Math.random() < 0.5;
    const N = getUpperLimit();
    const nMath = N.expr; // Use parenthetical form for linear/poly terms
    const nTex = N.tex;   // Use linear form ONLY for exponents

    if (isArithmetic) {
      const a = getRandomInt(-4, 4);
      const b = getRandomInt(-5, 5);
      if (a === 0 && b === 0) return sequenceSumGenerators.level1();

      let term = '';
      if (a !== 0) term += (a === 1 ? 'k' : (a === -1 ? '-k' : `${a}k`));
      if (b !== 0) term += (b > 0 ? (term ? `+${b}` : `${b}`) : `${b}`);
      
      const exprTex = (a !== 0 && b !== 0) ? wrapMath(term) : term;
      const q = texSigma(exprTex, nTex);
      
      let ans = '';
      if (a !== 0) {
        const f2 = fmtFrac(a, 2);
        const coeff = (f2 === '1' ? '' : (f2 === '-1' ? '-' : f2));
        ans += `${coeff}${nMath}^2`;
      }
      const c1Num = a + 2 * b;
      if (c1Num !== 0) {
        const f1 = fmtFrac(c1Num, 2);
        const sign = (f1.startsWith('-') || ans === '') ? '' : '+';
        const coeff = (f1 === '1' ? '' : (f1 === '-1' ? '-' : f1));
        ans += `${sign}${coeff}${nMath}`;
      }
      if (ans === '') ans = '0';
      return { question: q, answer: ans };
    } else {
      let a;
      while (true) { a = getRandomInt(-3, 3); if (a !== 0 && Math.abs(a) !== 1) break; }
      const b = getRandomInt(-1, 1);
      const c = getRandomNonZeroInt(-2, 2);
      
      const aTex = a < 0 ? wrapMath(a) : `${a}`;
      const cTex = (c === 1 ? '' : (c === -1 ? '-' : String.raw`${c} \cdot `));
      const bTex = (b === 0 ? 'k' : (b === 1 ? 'k+1' : `k-1`));
      const q = texSigma(String.raw`${cTex} ${aTex}^{${bTex}}`, nTex);
      
      const firstTermNum = c * Math.pow(a, 1 + b);
      const den = a - 1;
      const coeff = fmtFrac(firstTermNum, den);
      const aMath = a < 0 ? wrapMath(a) : `${a}`;
      const inner = String.raw`${aMath}^{${nTex}} - 1`;
      const ans = String.raw`${coeff === '1' ? '' : (coeff === '-1' ? '-' : coeff)}${wrapMath(inner)}`;
      return { question: q, answer: ans };
    }
  },

  level2: () => {
    const type = getRandomInt(1, 4);
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    
    if (type === 1) { // Cubic Polynomial
      let a = getRandomInt(-1, 1), b = getRandomInt(-2, 2), c = getRandomInt(-3, 3), d = getRandomInt(-4, 4);
      if (a === 0 && b === 0) return sequenceSumGenerators.level2();
      
      let term = '';
      const parts = [[a, 'k^3'], [b, 'k^2'], [c, 'k'], [d, '']];
      parts.forEach(([val, k]) => {
        if (val === 0) return;
        const sign = (val > 0 && term !== '') ? '+' : '';
        const coeff = (val === 1 && k !== '' ? '' : (val === -1 && k !== '' ? '-' : val));
        term += `${sign}${coeff}${k}`;
      });
      const q = texSigma(wrapMath(term), nTex);
      
      const parts_ans = [
        { num: a, den: 4, p: 4 },
        { num: 3 * a + 2 * b, den: 6, p: 3 },
        { num: 3 * a + 6 * b + 6 * c, den: 12, p: 2 },
        { num: b + 3 * c + 6 * d, den: 6, p: 1 }
      ];
      let ans = '';
      parts_ans.forEach(p => {
        if (p.num === 0) return;
        const f = fmtFrac(p.num, p.den);
        const sign = (f.startsWith('-') || ans === '') ? '' : '+';
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += String.raw`${sign}${coeff}${nMath}^{${p.p}}`;
      });
      if (ans.startsWith('+')) ans = ans.substring(1);
      return { question: q, answer: ans };
    } else if (type === 2) { // (ak+b)(ck+d) product
      let a = getRandomNonZeroInt(-2, 2), b = getRandomInt(-3, 3);
      let c = getRandomNonZeroInt(-2, 2), d = getRandomInt(-3, 3);
      const t1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const t2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const q = texSigma(String.raw`${wrapMath(t1)} ${wrapMath(t2)}`, nTex);
      const ac = a * c, adbc = a * d + b * c, bd = b * d;
      let ans = '';
      if (ac/3 !== 0) ans += String.raw`${fmtFrac(ac, 3)}${nMath}^3`;
      if ((ac+adbc)/2 !== 0) {
        const f = fmtFrac(ac + adbc, 2);
        ans += (f.startsWith('-') ? f : '+' + f) + String.raw`${nMath}^2`;
      }
      if ((ac+3*adbc+6*bd)/6 !== 0) {
        const f = fmtFrac(ac + 3 * adbc + 6 * bd, 6);
        ans += (f.startsWith('-') ? f : '+' + f) + String.raw`${nMath}`;
      }
      return { question: q, answer: ans.startsWith('+') ? ans.substring(1) : ans };
    } else if (type === 3) { // (k+a)^3
      const a = getRandomNonZeroInt(-3, 3);
      const q = texSigma(String.raw`${wrapMath(String.raw`k${a>0?'+'+a:a}`)}^3`, nTex);
      let ans = '';
      const parts = [
        { num: 1, den: 4, p: 4 },
        { num: 1+2*a, den: 2, p: 3 },
        { num: 1+6*a+6*a*a, den: 4, p: 2 },
        { num: a+3*a*a+2*a*a*a, den: 2, p: 1 }
      ];
      parts.forEach(p => {
        if (p.num === 0) return;
        const f = fmtFrac(p.num, p.den);
        const sign = (f.startsWith('-') || ans === '') ? '' : '+';
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += String.raw`${sign}${coeff}${nMath}^{${p.p}}`;
      });
      return { question: q, answer: ans };
    } else {
      const sub = getRandomInt(1, 2);
      if (sub === 1) { // sum k(k+1) = n(n+1)(n+2)/3
        const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}`, nTex);
        const ans = String.raw`\frac{1}{3}${wrapMath(N.n)}${wrapMath(N.np1)}${wrapMath(N.np2)}`;
        return { question: q, answer: ans };
      } else { // sum k(k+1)(k+2) = n(n+1)(n+2)(n+3)/4
        const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}`, nTex);
        const ans = String.raw`\frac{1}{4}${wrapMath(N.n)}${wrapMath(N.np1)}${wrapMath(N.np2)}${wrapMath(N.np3)}`;
        return { question: q, answer: ans };
      }
    }
  },

  level3: () => {
    const isDouble = Math.random() < 0.4;
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    if (isDouble) {
      const q = String.raw`\sum_{i=1}^{n}${wrapMath(String.raw`\sum_{j=1}^{n}ij`)}`;
      const ans = String.raw`\frac{1}{4}${nMath}^2${wrapMath(N.np1)}^2`;
      return { question: q, answer: ans };
    } else {
      const a = getRandomNonZeroInt(-2, 2);
      const q = texSigma(wrapMath(String.raw`n ${a>0?'+':''}${a}k`), nTex);
      const f2 = fmtFrac(2 + a, 2);
      const f1 = fmtFrac(a, 2);
      let ans = '';
      if (f2 !== '0') {
        const coeff = (f2 === '1' ? '' : (f2 === '-1' ? '-' : f2));
        ans += `${coeff}${nMath}^2`;
      }
      if (f1 !== '0') {
        const sign = (f1.startsWith('-') || ans === '') ? '' : '+';
        const coeff = (f1 === '1' ? '' : (f1 === '-1' ? '-' : f1));
        ans += `${sign}${coeff}${nMath}`;
      }
      return { question: q, answer: ans };
    }
  },

  level4: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const type = getRandomInt(1, 2);
    if (type === 1) {
      const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}`, nTex);
      return { question: q, answer: String.raw`\frac{1}{3}${wrapMath(N.n)}${wrapMath(N.np1)}${wrapMath(N.np2)}` };
    } else {
      const q = texSigma(String.raw`k${wrapMath(String.raw`k-1`)}`, nTex);
      return { question: q, answer: String.raw`\frac{1}{3}${wrapMath(N.nm1)}${wrapMath(N.n)}${wrapMath(N.np1)}` };
    }
  },

  level5: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const type = getRandomInt(1, 3);
    if (type === 1) {
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+1`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${wrapMath(N.n)}}{${wrapMath(N.np1)}}` };
    } else if (type === 2) {
      const q = texSigma(String.raw`\frac{1}{${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${wrapMath(N.n)}}{2${wrapMath(N.np2)}}` };
    } else {
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${wrapMath(N.n)}${wrapMath(N.np3)}}{4${wrapMath(N.np1)}${wrapMath(N.np2)}}` };
    }
  },

  level6: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const r = Math.random() < 0.5 ? 2 : 3;
    const q = texSigma(String.raw`k \cdot ${r}^{k}`, nTex);
    const den = (1 - r) * (1 - r);
    const ans = String.raw`\frac{${r} - ${wrapMath(N.np1)} ${r}^{${N.np1}} + ${wrapMath(N.n)} \cdot ${r}^{${N.np2}}}{${den}}`;
    return { question: q, answer: ans };
  },

  level7: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const q = texSigma(String.raw`\frac{2k+1}{k^2 ${wrapMath(String.raw`k+1`)}^2}`, nTex);
    return { question: q, answer: String.raw`\frac{${wrapMath(N.n)}${wrapMath(N.np2)}}{${wrapMath(N.np1)}^2}` };
  },

  level8: () => {
    const type = getRandomInt(1, 4); // Added factorial type
    const N = getUpperLimit();
    const nTex = N.tex;
    if (type === 1) {
      const q = texSigma(String.raw`\frac{1}{\sqrt{k+1} + \sqrt{k}}`, nTex);
      return { question: q, answer: String.raw`\sqrt{${N.np1}} - 1` };
    } else if (type === 2) {
      const q = texSigma(String.raw`\log_{2} \frac{k+1}{k}`, nTex);
      return { question: q, answer: String.raw`\log_{2} ${wrapMath(N.np1)}` };
    } else if (type === 3) {
      const q = texSigma(String.raw`k \cdot k!`, nTex);
      return { question: q, answer: String.raw`${wrapMath(N.np1)}! - 1` };
    } else {
      // Alternate: Sum_{k=1}^n 1/(sqrt(k+2) + sqrt(k+1))
      const q = texSigma(String.raw`\frac{1}{\sqrt{k+2} + \sqrt{k+1}}`, nTex);
      return { question: q, answer: String.raw`\sqrt{${N.np2}} - \sqrt{2}` };
    }
  }
};
