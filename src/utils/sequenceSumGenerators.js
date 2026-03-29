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

const texSigma = (exprTex, upperTex) => String.raw`\sum_{k=1}^{${upperTex}} ${exprTex}`;

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
  return String.raw`${sign}\frac{${Math.abs(n)}}{${Math.abs(d)}}`;
};

const fmtPolyFactor = (expr) => String.raw`\left(${expr}\right)`;

export const sequenceSumGenerators = {
  // レベル1: 等差数列・等比数列の和 (Fixed for testing)
  level1: () => {
    // 完全に固定したテスト問題
    // \sum_{k=1}^n 2\cdot (-2)^k
    return {
      question: String.raw`\sum_{k=1}^n 2\cdot (-2)^k`,
      answer: String.raw`-\frac{4}{3}\left((-2)^n - 1\right)`
    };
    /* 
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
      
      const exprTex = (a !== 0 && b !== 0) ? String.raw`\left( ${term} \right)` : term;
      const q = texSigma(exprTex, N.tex);
      
      // Answer: a/2 n(n+1) + bn = a/2 n^2 + (a/2 + b)n
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
      
      const aTex = a < 0 ? String.raw`\left( ${a} \right)` : `${a}`;
      const cTex = (c === 1 ? '' : (c === -1 ? '-' : String.raw`${c} \cdot `));
      const bTex = (b === 0 ? 'k' : (b === 1 ? 'k+1' : `k-1`));
      const q = texSigma(String.raw`${cTex} ${aTex}^{${bTex}}`, N.tex);
      
      // Answer: sum_{k=1}^n c a^{k+b} = c a^{1+b} (a^n - 1) / (a - 1)
      const firstTerm = c * Math.pow(a, 1 + b);
      const den = a - 1;
      const coeff = fmtFrac(firstTerm, den);
      const aMath = a < 0 ? `(${a})` : `${a}`;
      const ans = String.raw`${coeff === '1' ? '' : (coeff === '-1' ? '-' : coeff)}\left( ${aMath}^{${n}} - 1 \right)`;
      return { question: q, answer: ans };
    }
    */
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
      const q = texSigma(String.raw`\left( ${term} \right)`, N.tex);
      
      const c4 = a / 4;
      const c3 = a / 2 + b / 3;
      const c2 = a / 4 + b / 2 + c / 2;
      const c1 = b / 6 + c / 2 + d;
      
      const coeffs = [[c4, 4], [c3, 3], [c2, 2], [c1, 1]];
      let ans = '';
      coeffs.forEach(([val, p]) => {
        if (val === 0) return;
        const sign = (val > 0 && ans !== '') ? '+' : '';
        let num, den;
        if (p === 4) { num = a; den = 4; }
        else if (p === 3) { num = 3 * a + 2 * b; den = 6; }
        else if (p === 2) { num = 3 * a + 6 * b + 6 * c; den = 12; }
        else { num = b + 3 * c + 6 * d; den = 6; }
        
        const f = fmtFrac(num, den);
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += String.raw`${sign}${coeff}${n}^{${p}}`;
      });
      if (ans.startsWith('+')) ans = ans.substring(1);
      return { question: q, answer: ans };
    } else if (type === 2) { // (ak+b)(ck+d) product
      let a = getRandomNonZeroInt(-2, 2), b = getRandomInt(-3, 3);
      let c = getRandomNonZeroInt(-2, 2), d = getRandomInt(-3, 3);
      const t1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const t2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const q = texSigma(String.raw`\left( ${t1} \right) \left( ${t2} \right)`, N.tex);
      const ac = a * c, adbc = a * d + b * c, bd = b * d;
      let ans = '';
      if (ac/3 !== 0) ans += String.raw`${fmtFrac(ac, 3)}${n}^3`;
      if ((ac+adbc)/2 !== 0) {
        const f = fmtFrac(ac + adbc, 2);
        ans += (f.startsWith('-') ? f : '+' + f) + String.raw`${n}^2`;
      }
      if ((ac+3*adbc+6*bd)/6 !== 0) {
        const f = fmtFrac(ac + 3 * adbc + 6 * bd, 6);
        ans += (f.startsWith('-') ? f : '+' + f) + String.raw`${n}`;
      }
      return { question: q, answer: ans.startsWith('+') ? ans.substring(1) : ans };
    } else if (type === 3) { // (k+a)^3
      const a = getRandomNonZeroInt(-3, 3);
      const q = texSigma(String.raw`\left( k${a>0?'+'+a:a} \right)^3`, N.tex);
      let ans = '';
      const c4 = 1/4, c3 = 1/2 + a, c2 = 1/4 + 3*a/2 + 3*a*a/2, c1 = a/2 + 3*a*a/2 + a*a*a;
      
      const parts = [
        { c: c4, text: String.raw`${fmtFrac(1, 4)}${n}^4` },
        { c: c3, text: String.raw`${fmtFrac(1+2*a, 2)}${n}^3` },
        { c: c2, text: String.raw`${fmtFrac(1+6*a+6*a*a, 4)}${n}^2` },
        { c: c1, text: String.raw`${fmtFrac(a+3*a*a+2*a*a*a, 2)}${n}` }
      ];
      parts.forEach(p => {
        if (p.c === 0) return;
        const sign = (p.text.startsWith('-') ? '' : (ans !== '' ? '+' : ''));
        ans += `${sign}${p.text}`;
      });
      return { question: q, answer: ans };
    } else {
      const sub = getRandomInt(1, 2);
      if (sub === 1) { // k(k+1)
        const q = texSigma(String.raw`k\left( k+1 \right)`, N.tex);
        const ans = String.raw`\frac{1}{3}${n}\left(${n}+1\right)\left(${n}+2\right)`;
        return { question: q, answer: ans };
      } else { // k(k+1)(k+2)
        const q = texSigma(String.raw`k\left( k+1 \right)\left( k+2 \right)`, N.tex);
        const ans = String.raw`\frac{1}{4}${n}\left(${n}+1\right)\left(${n}+2\right)\left(${n}+3\right)`;
        return { question: q, answer: ans };
      }
    }
  },

  level3: () => {
    const isDouble = Math.random() < 0.4;
    const N = getUpperLimit();
    const n = N.expr;
    if (isDouble) {
      const q = String.raw`\sum_{i=1}^{n}\left(\sum_{j=1}^{n}ij\right)`;
      const ans = String.raw`\frac{1}{4}${n}^2\left( ${n}+1 \right)^2`;
      return { question: q, answer: ans };
    } else {
      const a = getRandomNonZeroInt(-2, 2);
      const q = texSigma(String.raw`\left( n ${a>0?'+':''}${a}k \right)`, N.tex);
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

  level4: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const type = getRandomInt(1, 2);
    if (type === 1) {
      const q = texSigma(String.raw`k\left( k+1 \right)`, N.tex);
      return { question: q, answer: String.raw`\frac{1}{3}${n}\left( ${n}+1 \right)\left( ${n}+2 \right)` };
    } else {
      const q = texSigma(String.raw`k\left( k-1 \right)`, N.tex);
      return { question: q, answer: String.raw`\frac{1}{3}\left( ${n}-1 \right)${n}\left( ${n}+1 \right)` };
    }
  },

  level5: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const type = getRandomInt(1, 3);
    if (type === 1) { // 1/k(k+1)
      const q = texSigma(String.raw`\frac{1}{k\left( k+1 \right)}`, N.tex);
      return { question: q, answer: String.raw`\frac{${n}}{${n}+1}` };
    } else if (type === 2) { // 1/(k+1)(k+2)
      const q = texSigma(String.raw`\frac{1}{\left( k+1 \right)\left( k+2 \right)}`, N.tex);
      return { question: q, answer: String.raw`\frac{${n}}{2\left( ${n}+2 \right)}` };
    } else { // 1/k(k+1)(k+2)
      const q = texSigma(String.raw`\frac{1}{k\left( k+1 \right)\left( k+2 \right)}`, N.tex);
      return { question: q, answer: String.raw`\frac{${n}\left( ${n}+3 \right)}{4\left( ${n}+1 \right)\left( ${n}+2 \right)}` };
    }
  },

  level6: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const r = Math.random() < 0.5 ? 2 : 3;
    const q = texSigma(String.raw`k \cdot ${r}^{k}`, N.tex);
    const den = (1 - r) * (1 - r);
    const ans = String.raw`\frac{${r} - \left( ${n}+1 \right) ${r}^{${n}+1} + ${n} \cdot ${r}^{${n}+2}}{${den}}`;
    return { question: q, answer: ans };
  },

  level7: () => {
    const N = getUpperLimit();
    const n = N.expr;
    const q = texSigma(String.raw`\frac{2k+1}{k^2 \left( k+1 \right)^2}`, N.tex);
    return { question: q, answer: String.raw`\frac{${n}\left( ${n}+2 \right)}{\left( ${n}+1 \right)^2}` };
  },

  level8: () => {
    const type = getRandomInt(1, 3);
    const N = getUpperLimit();
    const n = N.expr;
    if (type === 1) { // radical
      const q = texSigma(String.raw`\frac{1}{\sqrt{k+1} + \sqrt{k}}`, N.tex);
      return { question: q, answer: String.raw`\sqrt{${n}+1} - 1` };
    } else if (type === 2) { // log
      const q = texSigma(String.raw`\log_{2} \frac{k+1}{k}`, N.tex);
      return { question: q, answer: String.raw`\log_{2} \left( ${n}+1 \right)` };
    } else { // factorial
      const q = texSigma(String.raw`k \cdot k!`, N.tex);
      return { question: q, answer: String.raw`\left( ${n}+1 \right)! - 1` };
    }
  }
};
