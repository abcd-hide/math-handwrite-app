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
  if (/^[a-z](\^\{?[\d]+\}?)?$/.test(s) || /^[\d.]+$/.test(s)) return s; // Don't wrap single vars (simple power) or numbers
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
      
      // Factorized answer for arithmetic sum: S = (n/2) * (first + last)
      // first = a + b, last = a*n + b
      // first + last = a(n+1) + 2b
      // S = (n/2) * (an + a + 2b)
      // If upper limit is N: S = N/2 * (a*1 + b + a*N + b) = N/2 * (a(N+1) + 2b)
      const p1Num = a;
      const p0Num = a + 2 * b;
      const f1 = fmtFrac(p1Num, 2);
      const f0 = fmtFrac(p0Num, 2);
      
      let inner = '';
      if (f1 !== '0') {
          const coeff = (f1 === '1' ? '' : (f1 === '-1' ? '-' : f1));
          inner += `${coeff}${N.n}`;
      }
      if (f0 !== '0') {
          const sign = (f0.startsWith('-') || inner === '') ? '' : '+';
          inner += `${sign}${f0}`;
      }
      
      const ans = nMath === 'n' ? String.raw`${fmtFrac(1, 2)}${nMath}${wrapMath(inner)}` : String.raw`${fmtFrac(1, 2)}${nMath}${wrapMath(inner)}`;
      // Actually, let's just use the previous logic if it's simpler, or refine it.
      // The user wants factorized. n(an+a+2b)/2 is factorized enough.
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
        a = getRandomInt(-1, 1);
        b = getRandomInt(-2, 2);
        c = getRandomInt(-3, 3);
        d = getRandomInt(-4, 4);
        if (a === 0 && b === 0) continue;
        if (a % 2 === 0 || b % 3 === 0) break;
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
      
      // Use mathjs to simplify the expression for a factorized-looking result if possible
      // But since user wants specific factorized form, we'll build it carefully.
      // Sum_{k=1}^n (ak^3+bk^2+ck+d) = (a/4)n^2(n+1)^2 + (b/6)n(n+1)(2n+1) + (c/2)n(n+1) + dn
      // We will present it as a sum of factorized terms if we can factor out n.
      // Actually, safest is to represent as fractional sum of powers or factor out common denominator.
      // But user said "Factorized form".
      let ans = '';
      if (a !== 0) {
        const f = fmtFrac(a, 4);
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += String.raw`${coeff}${nMath}^2${wrapMath(N.np1)}^2`;
      }
      if (b !== 0) {
        const f = fmtFrac(b, 6);
        const sign = (f.startsWith('-') || ans === '') ? '' : '+';
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += String.raw`${sign}${coeff}${nMath}${wrapMath(N.np1)}${wrapMath(String.raw`2n+1`)}`;
      }
      if (c !== 0) {
        const f = fmtFrac(c, 2);
        const sign = (f.startsWith('-') || ans === '') ? '' : '+';
        const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
        ans += String.raw`${sign}${coeff}${nMath}${wrapMath(N.np1)}`;
      }
      if (d !== 0) {
        const sign = (d > 0 && ans !== '') ? '+' : (d < 0 ? '-' : '');
        const coeff = (Math.abs(d) === 1 ? '' : Math.abs(d));
        ans += String.raw`${sign}${coeff}${nMath}`;
      }
      if (ans.startsWith('+')) ans = ans.substring(1);
      return { question: q, answer: ans };
    } else if (type === 2) { // (ak+b)(ck+d) product
      let a = getRandomNonZeroInt(-2, 2), b = getRandomInt(-3, 3);
      let c = getRandomNonZeroInt(-2, 2), d = getRandomInt(-3, 3);
      const t1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const t2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const q = texSigma(String.raw`${wrapMath(t1)} ${wrapMath(t2)}`, nTex);
      // sum (ac k^2 + (ad+bc)k + bd) = (ac/6)n(n+1)(2n+1) + (ad+bc)/2 n(n+1) + bd n
      const ac = a * c, adbc = a * d + b * c, bd = b * d;
      let ans = '';
      if (ac !== 0) {
          const f = fmtFrac(ac, 6);
          const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
          ans += String.raw`${coeff}${nMath}${wrapMath(N.np1)}${wrapMath(String.raw`2n+1`)}`;
      }
      if (adbc !== 0) {
          const f = fmtFrac(adbc, 2);
          const sign = (f.startsWith('-') || ans === '') ? '' : '+';
          const coeff = (f === '1' ? '' : (f === '-1' ? '-' : f));
          ans += String.raw`${sign}${coeff}${nMath}${wrapMath(N.np1)}`;
      }
      if (bd !== 0) {
          const sign = (bd > 0 && ans !== '') ? '+' : (bd < 0 ? '-' : '');
          const coeff = (Math.abs(bd) === 1 ? '' : Math.abs(bd));
          ans += String.raw`${sign}${coeff}${nMath}`;
      }
      return { question: q, answer: ans.startsWith('+') ? ans.substring(1) : ans };
    } else if (type === 3) { // (k+a)^3
      const a = getRandomNonZeroInt(-3, 3);
      const q = texSigma(String.raw`${wrapMath(String.raw`k${a>0?'+'+a:a}`)}^3`, nTex);
      // sum_{k=1}^N (k+a)^3 = sum_{j=a+1}^{N+a} j^3 = S(N+a) - S(a)
      // where S(X) = X^2(X+1)^2/4
      // = [ (N+a)^2(N+a+1)^2 - a^2(a+1)^2 ] / 4
      const C = a * a * (a + 1) * (a + 1);
      const term1 = String.raw`${wrapMath(N.n + (a === 0 ? '' : (a > 0 ? '+' + a : a)))}^2 ${wrapMath(N.np1 + (a === 0 ? '' : (a > 0 ? '+' + a : a)))}^2`;
      const ans = String.raw`\frac{1}{4} \left\{ ${term1} ${C === 0 ? '' : (C > 0 ? '-' + C : '+' + Math.abs(C))} \right\}`;
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
    const type = getRandomInt(1, 4);
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    
    if (type === 1) { // sum_{i=1}^N sum_{j=1}^i ij
      const q = String.raw`\sum_{i=1}^{${nTex}}\left(\sum_{j=1}^{i}ij\right)`;
      // Sum_{i=1}^N 1/2 (i^3 + i^2) = 1/24 N(N+1)(N+2)(3N+1) with consistency:
      // If N=n, ans = 1/24 n(n+1)(n+2)(3n+1)
      // If N=n-1, np1=n, np2=n+1, np3=n+2. So ans = 1/24 (n-1)n(n+1)(3(n-1)+1) = (n-1)n(n+1)(3n-2)/24
      let term4 = '3n+1';
      if (nTex === 'n-1') term4 = '3n-2';
      if (nTex === 'n+1') term4 = '3n+4';
      const ans = String.raw`\frac{1}{24}${nMath}${wrapMath(N.np1)}${wrapMath(N.np2)}${wrapMath(term4)}`;
      return { question: q, answer: ans };
    } else if (type === 2) { // sum_k sum_l sum_m m
      const q = String.raw`\sum_{k=1}^{${nTex}}\left\{\sum_{\ell=1}^k\left(\sum_{m=1}^\ell m\right)\right\}`;
      const ans = String.raw`\frac{1}{24}${nMath}${wrapMath(N.np1)}${wrapMath(N.np2)}${wrapMath(N.np3)}`;
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
          const f2 = fmtFrac(2 + a, 2);
          const f0 = fmtFrac(2 * a, 2);
          let inner = '';
          if (f2 !== '0') inner += (f2 === '1' ? 'n' : (f2 === '-1' ? '-n' : f2 + 'n'));
          if (f0 !== '0') inner += (f0 > 0 ? '+' : '') + f0;
          return { question: q, answer: String.raw`${wrapMath(String.raw`n+1`)}${wrapMath(inner)}` };
      }
    } else { // sum_k sum_{l=1}^{k-1} l
      const q = String.raw`\sum_{k=1}^{${nTex}}\left(\sum_{\ell=1}^{k-1}\ell\right)`;
      // sum_{k=1}^N (k-1)k/2 = (N-1)N(N+1)/6
      const ans = String.raw`\frac{1}{6}${wrapMath(N.nm1)}${nMath}${wrapMath(N.np1)}`;
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
      return { question: q, answer: String.raw`\frac{1}{4}${nMath}${wrapMath(N.np1)}${wrapMath(N.np2)}${wrapMath(N.np3)}` };
    } else if (type === 2) { // k(k^2-1) = (k-1)k(k+1)
      const q = texSigma(String.raw`k${wrapMath(String.raw`k^2-1`)}`, nTex);
      return { question: q, answer: String.raw`\frac{1}{4}${wrapMath(N.nm1)}${nMath}${wrapMath(N.np1)}${wrapMath(N.np2)}` };
    } else if (type === 3) { // (2k-1)(2k+1) = 4k^2-1
      const q = texSigma(String.raw`${wrapMath(String.raw`2k-1`)}${wrapMath(String.raw`2k+1`)}`, nTex);
      // sum (2k-1)(2k+1) = n(4n^2-1)/3 + sum(4k^2-1) is n(4n^2+6n-1)/3
      // Actually there's a nice product: sum_{k=1}^n (2k-1)(2k+1) = n(4n^2+6n-1)/3
      const ans = String.raw`\frac{1}{3}${nMath}\left( 4n^2+6n-1 \right)`;
      return { question: q, answer: ans };
    } else { // (3k-2)(3k+1) or (3k-1)(3k+2)
      const sub = getRandomInt(1, 2);
      if (sub === 1) {
        const q = texSigma(String.raw`${wrapMath(String.raw`3k-2`)}${wrapMath(String.raw`3k+1`)}`, nTex);
        // sum (3k-2)(3k+1) = sum (9k^2 - 3k - 2) = 9*n(n+1)(2n+1)/6 - 3*n(n+1)/2 - 2n
        // = 3/2 n(n+1)(2n+1) - 3/2 n(n+1) - 2n = 3/2 n(n+1) [ 2n+1 - 1 ] - 2n = 3n^2(n+1) - 2n = 3n^3+3n^2-2n = n(3n^2+3n-2)
        return { question: q, answer: String.raw`${nMath}${wrapMath(String.raw`3n^2+3n-2`)}` };
      } else {
        const q = texSigma(String.raw`${wrapMath(String.raw`3k-1`)}${wrapMath(String.raw`3k+2`)}`, nTex);
        // sum (3k-1)(3k+2) = sum (9k^2 + 3k - 2) = 3/2 n(n+1)(2n+1) + 3/2 n(n+1) - 2n
        // = 3/2 n(n+1) [ 2n+1 + 1 ] - 2n = 3n(n+1)^2 - 2n = n [ 3(n^2+2n+1) - 2 ] = n(3n^2+6n+1)
        return { question: q, answer: String.raw`${nMath}${wrapMath(String.raw`3n^2+6n+1`)}` };
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
      return { question: q, answer: String.raw`\frac{${N.n}${wrapMath(N.np3)}}{4${wrapMath(N.np1)}${wrapMath(N.np2)}}` };
    } else if (type === 4) { // 1/k(k+2)
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+2`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${N.n}${wrapMath(String.raw`3n+5`)}}{4${wrapMath(N.np1)}${wrapMath(N.np2)}}` };
    } else if (type === 5) { // 1/(k^2+ak)
      const a = getRandomInt(1, 2);
      const q = texSigma(String.raw`\frac{1}{k^2 + ${a}k}`, nTex);
      if (a === 1) return { question: q, answer: String.raw`\frac{${N.n}}{${N.np1}}` };
      else return { question: q, answer: String.raw`\frac{${N.n}${wrapMath(String.raw`3n+5`)}}{4${wrapMath(N.np1)}${wrapMath(N.np2)}}` };
    } else { // 1/(2k+a)(2k+a+2)
      const aVal = [ -1, 1, 3 ][getRandomInt(0, 2)];
      const q = texSigma(String.raw`\frac{1}{${wrapMath(String.raw`2k${aVal>0?'+':''}${aVal}`)}${wrapMath(String.raw`2k${aVal+2>0?'+':''}${aVal+2}`)}}`, nTex);
      const den1 = 2 + aVal;
      const den2 = String.raw`2n${aVal+2>0?'+':''}${aVal+2}`;
      return { question: q, answer: String.raw`\frac{${N.n}}{${den1}${wrapMath(den2)}}` };
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
