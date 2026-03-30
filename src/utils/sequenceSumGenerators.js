import * as math from 'mathjs';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomNonZeroInt = (min, max) => {
  let res = 0;
  while (res === 0) res = getRandomInt(min, max);
  return res;
};

const getUpperLimit = () => {
    const r = Math.random();
    if (r < 0.34) return { tex: 'n', expr: 'n', n: 'n', np1: 'n+1', np2: 'n+2', np3: 'n+3', nm1: 'n-1' };
    if (r < 0.67) return { tex: 'n-1', expr: 'n-1', n: 'n-1', np1: 'n', np2: 'n+1', np3: 'n+2', nm1: 'n-2' };
    return { tex: 'n+1', expr: 'n+1', n: 'n+1', np1: 'n+2', np2: 'n+3', np3: 'n+4', nm1: 'n' };
};

const texSigma = (exprTex, upperTex) => String.raw`\sum_{k=1}^{${upperTex}} ${exprTex}`;

const wrapMath = (expr) => {
  const s = String(expr);
  if (/^[a-z](\^\{?[\d]+\}?)?$/.test(s) || /^[\d.]+$/.test(s)) return s; // Don't wrap single vars or numbers
  if (s.startsWith('\\left(') && s.endsWith('\\right)')) return s;
  if (s.includes('\\left\\{') || s.includes('\\{')) return String.raw`\left[ ${s} \right]`;
  if (s.includes('\\left(') || s.includes('(')) return String.raw`\left\{ ${s} \right\}`;
  return String.raw`\left( ${s} \right)`;
};

const fmtProduct = (factors) => {
  let res = '';
  factors.forEach((f, i) => {
    if (f === '1' || f === '') return;
    if (f === '-1') {
      res += '-';
      return;
    }
    const term = wrapMath(f);
    if (res === '-') {
       res += term;
    } else if (res !== '' && term.startsWith('-')) {
       res += term; // Handle signs in product sequence properly
    } else {
       res += term;
    }
  });
  return res || '1';
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
      
      // S = N/2 * (a(N+1) + 2b)
      // If N=n: n(an + a + 2b)/2
      // If N=n-1: (n-1)(an - a + a + 2b)/2 = (n-1)(an + 2b)/2
      // If N=n+1: (n+1)(an + a + a + 2b)/2 = (n+1)(an + 2a + 2b)/2
      let inner = '';
      if (nTex === 'n') {
        const c1 = a;
        const c0 = a + 2 * b;
        inner = `${c1 === 1 ? 'n' : (c1 === -1 ? '-n' : (c1 === 0 ? '' : c1 + 'n'))}${c0 > 0 ? (c1 !== 0 ? '+' : '') + c0 : (c0 < 0 ? c0 : (c1 === 0 ? '0' : ''))}`;
      } else if (nTex === 'n-1') {
        const c1 = a;
        const c0 = 2 * b;
        inner = `${c1 === 1 ? 'n' : (c1 === -1 ? '-n' : (c1 === 0 ? '' : c1 + 'n'))}${c0 > 0 ? (c1 !== 0 ? '+' : '') + c0 : (c0 < 0 ? c0 : (c1 === 0 ? '0' : ''))}`;
      } else { // n+1
        const c1 = a;
        const c0 = 2 * a + 2 * b;
        inner = `${c1 === 1 ? 'n' : (c1 === -1 ? '-n' : (c1 === 0 ? '' : c1 + 'n'))}${c0 > 0 ? (c1 !== 0 ? '+' : '') + c0 : (c0 < 0 ? c0 : (c1 === 0 ? '0' : ''))}`;
      }
      
      const ans = String.raw`\frac{${fmtProduct([nMath, inner])}}{2}`;
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
      let a, b, c, d;
      while (true) {
        a = getRandomNonZeroInt(-2, 2) * 2;
        b = getRandomInt(-2, 2) * 3;
        c = getRandomInt(-2, 2) * 2;
        d = getRandomInt(-3, 3);
        if (a !== 0) break;
      }
      
      let term = '';
      const parts = [[a, 'k^3'], [b, 'k^2'], [c, 'k'], [d, '']];
      parts.forEach(([val, k]) => {
        if (val === 0) return;
        const sign = (val > 0 && term !== '') ? '+' : '';
        const coeff = (val === 1 && k !== '' ? '' : (val === -1 && k !== '' ? '-' : val));
        term += `${sign}${coeff}${k}`;
      });
      const q = texSigma(wrapMath(term), nTex);
      
      let ans = '';
      // S = 1/4 aN^2(N+1)^2 + 1/6 bN(N+1)(2N+1) + 1/2 cN(N+1) + dN
      const fA = fmtFrac(a, 4);
      if (fA !== '0') ans += fmtProduct([fA, nMath + '^2', wrapMath(N.np1) + '^2']);
      
      const fB = fmtFrac(b, 6);
      if (fB !== '0') {
          const sign = (fB.startsWith('-') || ans === '') ? '' : '+';
          const n2v = (nTex === 'n' ? '2n+1' : (nTex === 'n-1' ? '2n-1' : '2n+3'));
          ans += sign + fmtProduct([fB, nMath, N.np1, n2v]);
      }
      const fC = fmtFrac(c, 2);
      if (fC !== '0') {
          const sign = (fC.startsWith('-') || ans === '') ? '' : '+';
          ans += sign + fmtProduct([fC, nMath, N.np1]);
      }
      if (d !== 0) {
          const sign = (d > 0 && ans !== '') ? '+' : (d < 0 ? '-' : '');
          const coeff = (Math.abs(d) === 1 ? '' : Math.abs(d));
          ans += sign + coeff + nMath;
      }
      return { question: q, answer: ans };
    } else if (type === 2) { // (ak+b)(ck+d) product
      let a = getRandomNonZeroInt(-2, 2), b = getRandomInt(-3, 3);
      let c = getRandomNonZeroInt(-2, 2), d = getRandomInt(-3, 3);
      const tt1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const tt2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const q = texSigma(String.raw`${wrapMath(tt1)} ${wrapMath(tt2)}`, nTex);
      const ac = a * c, adbc = a * d + b * c, bd = b * d;
      let ans = '';
      const n2v = (nTex === 'n' ? '2n+1' : (nTex === 'n-1' ? '2n-1' : '2n+3'));
      if (ac !== 0) {
          ans += fmtProduct([fmtFrac(ac, 6), nMath, N.np1, n2v]);
      }
      if (adbc !== 0) {
          const f = fmtFrac(adbc, 2);
          const sign = (f.startsWith('-') || ans === '') ? '' : '+';
          ans += sign + fmtProduct([f, nMath, N.np1]);
      }
      if (bd !== 0) {
          const sign = (bd > 0 && ans !== '') ? '+' : (bd < 0 ? '-' : '');
          const coeff = (Math.abs(bd) === 1 ? '' : Math.abs(bd));
          ans += sign + coeff + nMath;
      }
      return { question: q, answer: ans };
    } else if (type === 3) { // (k+a)^3
      const aVal = getRandomNonZeroInt(-3, 3);
      const q = texSigma(String.raw`${wrapMath(String.raw`k${aVal>0?'+'+aVal:aVal}`)}^3`, nTex);
      // sum_{k=1}^N (k+aVal)^3 = S(N+aVal) - S(aVal) where S(X) = X^2(X+1)^2/4
      const CVal = aVal * aVal * (aVal + 1) * (aVal + 1);
      const L1 = (nTex==='n'?aVal:(nTex==='n-1'?aVal-1:aVal+1));
      const L2 = (nTex==='n'?aVal+1:(nTex==='n-1'?aVal:aVal+2));
      const t1 = `n${L1===0?'':(L1>0?'+'+L1:L1)}`;
      const t2 = `n${L2===0?'':(L2>0?'+'+L2:L2)}`;
      const term1 = fmtProduct([wrapMath(t1) + '^2', wrapMath(t2) + '^2']);
      const ans = String.raw`\frac{1}{4} \left\{ ${term1} ${CVal === 0 ? '' : (CVal > 0 ? '-' + CVal : '+' + Math.abs(CVal))} \right\}`;
      return { question: q, answer: ans };
    } else {
      const sub = getRandomInt(1, 2);
      if (sub === 1) { // sum k(k+1) = n(n+1)(n+2)/3
        const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}`, nTex);
        const ans = String.raw`\frac{1}{3}${fmtProduct([nMath, N.np1, N.np2])}`;
        return { question: q, answer: ans };
      } else { // sum k(k+1)(k+2) = n(n+1)(n+2)(n+3)/4
        const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}`, nTex);
        const ans = String.raw`\frac{1}{4}${fmtProduct([nMath, N.np1, N.np2, N.np3])}`;
        return { question: q, answer: ans };
      }
    }
  },

  level3: () => {
    const type = getRandomInt(1, 4);
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    
    if (type === 1) { // sum_{i=1}^N sum_{j=1}^i ij
      const q = String.raw`\sum_{i=1}^{${nTex}}\left(\sum_{j=1}^{i}ij\right)`;
      // Result N(N+1)(N+2)(3N+1)/24
      const term4 = (nTex === 'n' ? '3n+1' : (nTex === 'n-1' ? '3n-2' : '3n+4'));
      const ans = String.raw`\frac{1}{24}${fmtProduct([nMath, N.np1, N.np2, term4])}`;
      return { question: q, answer: ans };
    } else if (type === 2) { // sum_k sum_l sum_m m
      const q = String.raw`\sum_{k=1}^{${nTex}}\left\{\sum_{\ell=1}^k\left(\sum_{m=1}^\ell m\right)\right\}`;
      // result N(N+1)(N+2)(N+3)/24
      const ans = String.raw`\frac{1}{24}${fmtProduct([nMath, N.np1, N.np2, N.np3])}`;
      return { question: q, answer: ans };
    } else if (type === 3) { // sum (n + ak)
      const a = getRandomNonZeroInt(-2, 2);
      const aTerm = (a === 1 ? 'k' : (a === -1 ? '-k' : `${a}k`));
      const q = String.raw`\sum_{k=1}^{${nTex}} ${wrapMath(String.raw`n ${a>0?'+':''}${aTerm}`)}`;
      // sum_{k=1}^N (n + ak) = N*n + a*N(N+1)/2
      // If N=n: n^2 + a*n(n+1)/2 = (2n^2 + an^2 + an)/2 = ((2+a)n^2 + an)/2
      // If N=n-1: (n-1)n + a(n-1)n/2 = (2+a)n(n-1)/2
      // If N=n+1: (n+1)n + a(n+1)(n+2)/2 = (n+1)[ n + a(n+2)/2 ] = (n+1)(2n+an+2a)/2 = (n+1)((2+a)n+2a)/2
      if (nTex === 'n') {
          const f2 = fmtFrac(2 + a, 2);
          const f1 = fmtFrac(a, 2);
          let ans = '';
          if (f2 !== '0') {
              const coeff = (f2 === '1' ? '' : (f2 === '-1' ? '-' : f2));
              ans += `${coeff}n^2`;
          }
          if (f1 !== '0') {
              const sign = (f1.startsWith('-') || ans === '') ? '' : '+';
              const coeff = (f1 === '1' ? '' : (f1 === '-1' ? '-' : f1));
              ans += `${sign}${coeff}n`;
          }
          return { question: q, answer: ans };
      } else if (nTex === 'n-1') {
          const coeff = fmtFrac(2 + a, 2);
          const cstr = (coeff === '1' ? '' : (coeff === '-1' ? '-' : coeff));
          const ans = String.raw`${cstr}n${wrapMath(String.raw`n-1`)}`;
          return { question: q, answer: ans };
      } else { // n+1
          const bV = (2 + a);
          const cV = 2 * a;
          const inner = `${bV === 1 ? 'n' : (bV === -1 ? '-n' : (bV === 0 ? '' : bV + 'n'))}${cV > 0 ? (bV !== 0 ? '+' : '') + cV : (cV < 0 ? cV : (bV === 0 ? '0' : ''))}`;
          return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, inner])}}{2}` }; // USE N.n (already fixed in prev turn, but verifying)
      }
    } else { // sum_k sum_{l=1}^{k-1} l
      const q = String.raw`\sum_{k=1}^{${nTex}}\left(\sum_{\ell=1}^{k-1}\ell\right)`;
      const ans = String.raw`\frac{1}{6}${fmtProduct([N.nm1, nMath, N.np1])}`;
      return { question: q, answer: ans };
    }
  },

  level4: () => {
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    const type = getRandomInt(1, 4);
    if (type === 1) { // k(k+1)(k+2)
      const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}`, nTex);
      return { question: q, answer: String.raw`\frac{1}{4}${fmtProduct([nMath, N.np1, N.np2, N.np3])}` };
    } else if (type === 2) { // k(k^2-1) = (k-1)k(k+1)
      const q = texSigma(String.raw`k${wrapMath(String.raw`k^2-1`)}`, nTex);
      return { question: q, answer: String.raw`\frac{1}{4}${fmtProduct([N.nm1, nMath, N.np1, N.np2])}` };
    } else if (type === 3) { // (2k-1)(2k+1)
      const q = texSigma(String.raw`${wrapMath(String.raw`2k-1`)}${wrapMath(String.raw`2k+1`)}`, nTex);
      const innerStr = (nTex === 'n' ? '4n^2+6n-1' : (nTex === 'n-1' ? '4n^2-6n+1' : '4n^2+18n+11'));
      return { question: q, answer: String.raw`\frac{1}{3}${fmtProduct([nMath, innerStr])}` };
    } else { // (3k-2)(3k+1) or (3k-1)(3k+2)
      const sub = getRandomInt(1, 2);
      if (sub === 1) {
        const q = texSigma(String.raw`${wrapMath(String.raw`3k-2`)}${wrapMath(String.raw`3k+1`)}`, nTex);
        const inner = (nTex === 'n' ? '3n^2+3n-2' : (nTex === 'n-1' ? '3n^2-3n-2' : '3n^2+9n+4'));
        return { question: q, answer: fmtProduct([nMath, inner]) };
      } else {
        const q = texSigma(String.raw`${wrapMath(String.raw`3k-1`)}${wrapMath(String.raw`3k+2`)}`, nTex);
        const inner = (nTex === 'n' ? '3n^2+6n+1' : (nTex === 'n-1' ? '3n^2-2' : '3n^2+12n+10'));
        return { question: q, answer: fmtProduct([nMath, inner]) };
      }
    }
  },

  level5: () => {
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    const type = getRandomInt(1, 6);
    if (type === 1) { // 1/k(k+1)
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+1`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${N.n}}{${N.np1}}` };
    } else if (type === 2) { // 1/(k+1)(k+2)
      const q = texSigma(String.raw`\frac{1}{${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${N.n}}{2${wrapMath(N.np2)}}` };
    } else if (type === 3) { // 1/k(k+1)(k+2)
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, N.np3])}}{4${fmtProduct([N.np1, N.np2])}}` };
    } else if (type === 4) { // 1/k(k+2)
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+2`)}}`, nTex);
      const innerStr = (nTex === 'n' ? '3n+5' : (nTex === 'n-1' ? '3n+2' : '3n+8'));
      return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, innerStr])}}{4${fmtProduct([N.np1, N.np2])}}` };
    } else if (type === 5) { // 1/(k^2+ak)
      const aVal = getRandomInt(1, 2);
      const q = texSigma(String.raw`\frac{1}{k^2 + ${aVal}k}`, nTex);
      if (aVal === 1) return { question: q, answer: String.raw`\frac{${N.n}}{${N.np1}}` };
      const innerStr = (nTex === 'n' ? '3n+5' : (nTex === 'n-1' ? '3n+2' : '3n+8'));
      return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, innerStr])}}{4${fmtProduct([N.np1, N.np2])}}` };
    } else { // 1/(2k+a)(2k+a+2)
      const aSub = [ -1, 1, 3 ][getRandomInt(0, 2)];
      const q = texSigma(String.raw`\frac{1}{${wrapMath(String.raw`2k${aSub>0?'+':''}${aSub}`)}${wrapMath(String.raw`2k${aSub+2>0?'+':''}${aSub+2}`)}}`, nTex);
      const denOuter = 2 + aSub;
      const denInner = `2n${(nTex==='n'? (aSub+2>0?'+'+(aSub+2):aSub+2) : (nTex==='n-1'? (aSub>0?'+'+aSub:aSub) : (aSub+4>0?'+'+(aSub+4):aSub+4)) )}`;
      return { question: q, answer: String.raw`\frac{${N.n}}{${denOuter}${wrapMath(denInner)}}` };
    }
  },

  level6: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const r = Math.random() < 0.5 ? 2 : 3;
    const q = texSigma(String.raw`k \cdot ${r}^{k}`, nTex);
    const den = (1 - r) * (1 - r);
    const ans = String.raw`\frac{${fmtProduct([r, '-', wrapMath(N.np1), String.raw`${r}^{${N.np1}}`, '+', wrapMath(N.n), String.raw`${r}^{${N.np2}}`])}}{${den}}`;
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
