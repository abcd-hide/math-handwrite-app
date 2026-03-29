import * as math from 'mathjs';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomNonZeroInt = (min, max) => {
  let res = 0;
  while (res === 0) res = getRandomInt(min, max);
  return res;
};

const getUpperLimit = () => {
    const r = Math.random();
    if (r < 0.33) return { tex: 'n', expr: 'n' };
    if (r < 0.66) return { tex: 'n-1', expr: '(n-1)' };
    return { tex: 'n+1', expr: '(n+1)' };
};

const texSigma = (exprTex, upperTex) => `\\sum_{k=1}^{${upperTex}} ${exprTex}`;

// LaTeX formatter helpers
const fmtFrac = (num, den) => {
  if (den === 1) return `${num}`;
  if (num === 0) return `0`;
  const g = (a, b) => b === 0 ? Math.abs(a) : g(b, a % b);
  const common = g(num, den);
  const n = num / common;
  const d = den / common;
  if (d === 1) return `${n}`;
  const sign = (n * d < 0) ? '-' : '';
  return `${sign}\\frac{${Math.abs(n)}}{${Math.abs(d)}}`;
};

const fmtPolyFactor = (expr) => `\\left(${expr}\\right)`;

export const sequenceSumGenerators = {
  // レベル1: 等差数列・等比数列の和
  level1: () => {
    const isArithmetic = Math.random() < 0.5;
    const N = getUpperLimit();
    const n = N.expr;

    if (isArithmetic) {
      const a = getRandomInt(-4, 4);
      const b = getRandomInt(-5, 5);
      if (a === 0 && b === 0) return sequenceSumGenerators.level1();

      let term = '';
      if (a !== 0) term += (a === 1 ? 'k' : (a === -1 ? '-k' : `${a}k`));
      if (b !== 0) term += (b > 0 ? (term ? `+${b}` : `${b}`) : `${b}`);
      
      const exprTex = (a !== 0 && b !== 0) ? `\\left( ${term} \\right)` : term;
      const q = texSigma(exprTex, N.tex);
      
      // Answer: a/2 n(n+1) + bn = a/2 n^2 + (a/2 + b)n
      // Expanded form in descending order
      const c2 = a / 2;
      const c1 = a / 2 + b;
      
      let ans = '';
      if (c2 !== 0) {
        const f2 = fmtFrac(a, 2);
        ans += (f2 === '1' ? `${n}^2` : (f2 === '-1' ? `-${n}^2` : `${f2}${n}^2`));
      }
      if (c1 !== 0) {
        const sign = (c1 > 0 && ans !== '') ? '+' : '';
        const f1 = fmtFrac(a + 2 * b, 2);
        const coeff = (f1 === '1' ? '' : (f1 === '-1' ? '-' : f1));
        ans += `${sign}${coeff}${n}`;
      }
      if (ans === '') ans = '0';
      return { question: q, answer: ans };
    } else {
      // 等比数列 ca^{k+b}
      let a;
      while (true) { a = getRandomInt(-3, 3); if (a !== 0 && Math.abs(a) !== 1) break; }
      const b = getRandomInt(-1, 1);
      const c = getRandomNonZeroInt(-2, 2);
      
      const aTex = a < 0 ? `\\left( ${a} \\right)` : `${a}`;
      const cTex = (c === 1 ? '' : (c === -1 ? '-' : `${c} \\cdot `));
      const bTex = (b === 0 ? 'k' : (b === 1 ? 'k+1' : `k-1`));
      const q = texSigma(`${cTex} ${aTex}^{${bTex}}`, N.tex);
      
      // Answer: sum_{k=1}^n c a^{k+b} = c a^{1+b} (a^n - 1) / (a - 1)
      const firstTerm = c * Math.pow(a, 1 + b);
      const den = a - 1;
      const coeff = fmtFrac(firstTerm, den);
      const aMath = a < 0 ? `(${a})` : `${a}`;
      const ans = `${coeff === '1' ? '' : (coeff === '-1' ? '-' : coeff)}\\left( ${aMath}^{${n}} - 1 \\right)`;
      return { question: q, answer: ans };
    }
  },

  // レベル2: 多項式、積の形、立方、連続整数積
  level2: () => {
    const type = getRandomInt(1, 5);
    const N = getUpperLimit();
    const n = N.expr;
    
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
      const q = texSigma(`\\left( ${term} \\right)`, N.tex);
      
      // S = a (n(n+1)/2)^2 + b n(n+1)(2n+1)/6 + c n(n+1)/2 + d n
      // Expanded form
      // Sum k^3 = 1/4 n^4 + 1/2 n^3 + 1/4 n^2
      // Sum k^2 = 1/3 n^3 + 1/2 n^2 + 1/6 n
      // Sum k   = 1/2 n^2 + 1/2 n
      // Sum 1   = n
      const c4 = a / 4;
      const c3 = a / 2 + b / 3;
      const c2 = a / 4 + b / 2 + c / 2;
      const c1 = b / 6 + c / 2 + d;
      
      const coeffs = [[c4, 4], [c3, 3], [c2, 2], [c1, 1]];
      let ans = '';
      coeffs.forEach(([val, p]) => {
        if (val === 0) return;
        const sign = (val > 0 && ans !== '') ? '+' : '';
        // Find common denominator for display
        let num, den;
        if (p === 4) { num = a; den = 4; }
        else if (p === 3) { num = 3 * a + 2 * b; den = 6; }
        else if (p === 2) { num = 3 * a + 6 * b + 6 * c; den = 12; }
        else { num = b + 3 * c + 6 * d; den = 6; }
        
        const f = fmtFrac(num, den);
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += `${sign}${coeff}${n}^{${p}}`;
      });
      if (ans.startsWith('+')) ans = ans.substring(1);
      return { question: q, answer: ans };
    } else if (type === 2) { // (ak+b)(ck+d) product
      let a = getRandomNonZeroInt(-2, 2), b = getRandomInt(-3, 3);
      let c = getRandomNonZeroInt(-2, 2), d = getRandomInt(-3, 3);
      const t1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const t2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const q = texSigma(`\\left( ${t1} \\right) \\left( ${t2} \\right)`, N.tex);
      // (ac)k^2 + (ad+bc)k + bd
      const ac = a * c, adbc = a * d + b * c, bd = b * d;
      const c3 = ac / 3;
      const c2 = ac / 2 + adbc / 2;
      const c1 = ac / 6 + adbc / 2 + bd;
      
      let ans = '';
      if (c3 !== 0) ans += `${fmtFrac(ac, 3)}${n}^3`;
      if (c2 !== 0) {
        const f = fmtFrac(ac + adbc, 2);
        ans += (f.startsWith('-') ? f : '+' + f) + `${n}^2`;
      }
      if (c1 !== 0) {
        const f = fmtFrac(ac + 3 * adbc + 6 * bd, 6);
        ans += (f.startsWith('-') ? f : '+' + f) + `${n}`;
      }
      return { question: q, answer: ans.startsWith('+') ? ans.substring(1) : ans };
    } else if (type === 3) { // (k+a)^3
      const a = getRandomNonZeroInt(-3, 3);
      const q = texSigma(`\\left( k${a>0?'+'+a:a} \\right)^3`, N.tex);
      // Sum k^3 + 3a Sum k^2 + 3a^2 Sum k + a^3 Sum 1
      let ans = '';
      const c4 = 1/4, c3 = 1/2 + a, c2 = 1/4 + 3*a/2 + 3*a*a/2, c1 = a/2 + 3*a*a/2 + a*a*a;
      
      const parts = [
        { c: c4, text: `${fmtFrac(1, 4)}${n}^4` },
        { c: c3, text: `${fmtFrac(1+2*a, 2)}${n}^3` },
        { c: c2, text: `${fmtFrac(1+6*a+6*a*a, 4)}${n}^2` },
        { c: c1, text: `${fmtFrac(a+3*a*a+2*a*a*a, 2)}${n}` }
      ];
      
      parts.forEach(p => {
        if (p.c === 0) return;
        const sign = (p.text.startsWith('-') ? '' : (ans !== '' ? '+' : ''));
        ans += `${sign}${p.text}`;
      });
      
      return { question: q, answer: ans };
    } else { // Factorial-like products: k(k+1) or k(k+1)(k+2)
      const sub = getRandomInt(1, 2);
      if (sub === 1) { // k(k+1)
        const q = texSigma(`k\\left( k+1 \\right)`, N.tex);
        const ans = `\\frac{1}{3}${n}\\left(${n}+1\\right)\\left(${n}+2\\right)`;
        return { question: q, answer: ans };
      } else { // k(k+1)(k+2)
        const q = texSigma(`k\\left( k+1 \\right)\\left( k+2 \\right)`, N.tex);
        const ans = `\\frac{1}{4}${n}\\left(${n}+1\\right)\\left(${n}+2\\right)\\left(${n}+3\\right)`;
        return { question: q, answer: ans };
      }
    }
  },

  // レベル3: nが含まれる式、二重シグマ
  level3: () => {
    const isDouble = Math.random() < 0.4;
    const N = getUpperLimit();
    const n = N.expr;
    if (isDouble) {
      const q = `\\sum_{i=1}^{n}\\left(\\sum_{j=1}^{n}ij\\right)`;
      // (sum i) * (sum j) = (n(n+1)/2)^2 = 1/4 n^2(n+1)^2
      const ans = `\\frac{1}{4}${n}^2\\left( ${n}+1 \\right)^2`;
      return { question: q, answer: ans };
    } else {
      // Expression containing n, e.g., sum_{k=1}^n (n-2k)
      const a = getRandomNonZeroInt(-2, 2);
      const q = texSigma(`\\left( n ${a>0?'+':''}${a}k \\right)`, N.tex);
      // sum n = n^2, sum ak = a n(n+1)/2
      // Result = n^2 + a n(n+1)/2 = (1 + a/2)n^2 + (a/2)n
      const f2 = fmtFrac(2 + a, 2);
      const f1 = fmtFrac(a, 2);
      let ans = '';
      if (f2 !== '0') ans += (f2 === '1' ? `${n}^2` : (f2 === '-1' ? `-${n}^2` : `${f2}${n}^2`));
      if (f1 !== '0') {
        const sign = (f1.startsWith('-') || ans === '') ? f1 : '+' + f1;
        ans += (sign === '1' || sign === '+1' ? '+' : (sign === '-1' ? '-' : sign)) + n;
      }
      return { question: q, answer: ans.startsWith('+') ? ans.substring(1) : ans };
    }
  },

  // レベル4: 連続する整数の積の和
  level4: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const type = getRandomInt(1, 2);
    if (type === 1) {
      const q = texSigma(`k\\left( k+1 \\right)`, N.tex);
      return { question: q, answer: `\\frac{1}{3}${n}\\left( ${n}+1 \\right)\\left( ${n}+2 \\right)` };
    } else {
      const q = texSigma(`k\\left( k-1 \\right)`, N.tex);
      return { question: q, answer: `\\frac{1}{3}\\left( ${n}-1 \\right)${n}\\left( ${n}+1 \\right)` };
    }
  },

  // レベル5: 部分分数分解 (telescoping)
  level5: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const type = getRandomInt(1, 3);
    if (type === 1) { // 1/k(k+1)
      const q = texSigma(`\\frac{1}{k\\left( k+1 \\right)}`, N.tex);
      // 1-1/(n+1) = n/(n+1)
      return { question: q, answer: `\\frac{${n}}{${n}+1}` };
    } else if (type === 2) { // 1/(k+1)(k+2)
      const q = texSigma(`\\frac{1}{\\left( k+1 \\right)\\left( k+2 \\right)}`, N.tex);
      // 1/2 - 1/(n+2) = n/(2(n+2))
      return { question: q, answer: `\\frac{${n}}{2\\left( ${n}+2 \\right)}` };
    } else { // 1/k(k+1)(k+2)
      const q = texSigma(`\\frac{1}{k\\left( k+1 \\right)\\left( k+2 \\right)}`, N.tex);
      // 1/2 [ 1/1*2 - 1/(n+1)(n+2) ] = 1/4 - 1/2(n+1)(n+2)
      return { question: q, answer: `\\frac{${n}\\left( ${n}+3 \\right)}{4\\left( ${n}+1 \\right)\\left( ${n}+2 \\right)}` };
    }
  },

  // レベル6: (ak+b)c^(k+d) -- Arithmetico-geometric series
  level6: () => {
    const N = getUpperLimit();
    const n = N.expr;
    // sum (k r^k) = [r - (n+1)r^{n+1} + n r^{n+2}] / (1-r)^2
    const r = Math.random() < 0.5 ? 2 : 3;
    const q = texSigma(`k \\cdot ${r}^{k}`, N.tex);
    const den = (1 - r) * (1 - r);
    const ans = `\\frac{${r} - \\left( ${n}+1 \\right) ${r}^{${n}+1} + ${n} \\cdot ${r}^{${n}+2}}{${den}}`;
    return { question: q, answer: ans };
  },

  // レベル7: 高度な部分分数分解など
  level7: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const q = texSigma(`\\frac{2k+1}{k^2 \\left( k+1 \\right)^2}`, N.tex);
    // (2k+1)/k^2(k+1)^2 = 1/k^2 - 1/(k+1)^2
    // Sum = 1 - 1/(n+1)^2 = n(n+2)/(n+1)^2
    const ans = `\\frac{${n}\\left( ${n}+2 \\right)}{\\left( ${n}+1 \\right)^2}`;
    return { question: q, answer: ans };
  },

  // レベル8: 階乗、対数、根号
  level8: () => {
    const type = getRandomInt(1, 3);
    const N = getUpperLimit();
    const n = N.expr;
    if (type === 1) { // radical sum: 1/(sqrt(k+1) + sqrt(k)) = sqrt(k+1) - sqrt(k)
      const q = texSigma(`\\frac{1}{\\sqrt{k+1} + \\sqrt{k}}`, N.tex);
      const ans = `\\sqrt{${n}+1} - 1`;
      return { question: q, answer: ans };
    } else if (type === 2) { // log sum: log2(k+1/k) = log2(k+1) - log2(k)
      const q = texSigma(`\\log_{2} \\frac{k+1}{k}`, N.tex);
      const ans = `\\log_{2} \\left( ${n}+1 \\right)`;
      return { question: q, answer: ans };
    } else { // factorial sum: k * k! = (k+1)! - k!
      const q = texSigma(`k \\cdot k!`, N.tex);
      const ans = `\\left( ${n}+1 \\right)! - 1`;
      return { question: q, answer: ans };
    }
  }
};
