import * as math from 'mathjs';

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomNonZeroInt = (min, max) => {
  let res = 0;
  while (res === 0) res = getRandomInt(min, max);
  return res;
};

const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, Math.round(a % b));

const simplifyFactor = (a, b, varName = 'n') => {
  if (a === 0 && b === 0) return '0';
  if (a === 0) return `${b}`;
  if (b === 0) return (a === 1 ? varName : (a === -1 ? `-${varName}` : `${a}${varName}`));
  
  const common = gcd(a, b);
  const aa = a / common;
  const bb = b / common;
  
  let inner = '';
  if (aa === 1) inner = varName;
  else if (aa === -1) inner = `-${varName}`;
  else inner = `${aa}${varName}`;
  
  if (bb > 0) inner += `+${bb}`;
  else if (bb < 0) inner += `${bb}`;
  
  if (common === 1) return inner;
  if (common === -1) return `-\\left( ${inner} \\right)`;
  return `${common}\\left( ${inner} \\right)`;
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
  const common = gcd(num, den);
  const n = num / common;
  const d = den / common;
  if (d === 1) return `${n}`;
  const sign = (n * d < 0) ? '-' : '';
  return String.raw`${sign}\frac{${Math.abs(n)}}{${Math.abs(d)}}`;
};

/**
 * Formats a polynomial an^4 + bn^3 + cn^2 + dn + e as a clean LaTeX string.
 * coeffs: [e, d, c, b, a] where a is n^4 coefficient
 */
const fmtPolynomial = (coeffs, varName = 'n') => {
  let res = '';
  const degrees = coeffs.length - 1;
  const eps = 1e-10;
  
  for (let i = degrees; i >= 0; i--) {
    let c = coeffs[i];
    if (Math.abs(c) < eps) continue;
    
    let cStr = '';
    const sign = (c < -eps ? '-' : (res === '' ? '' : '+'));
    const absC = Math.abs(c);

    if (Math.abs(absC - Math.round(absC)) < eps) {
      // Handle integer-like coefficients
      const intC = Math.round(absC);
      if (intC === 1 && i > 0) {
        cStr = sign;
      } else {
        cStr = sign + intC;
      }
    } else {
      // Handle rational/float coefficients
      let frac = '';
      for (let d = 1; d <= 24; d++) {
        if (Math.abs(absC * d - Math.round(absC * d)) < eps) {
          const num = Math.round(absC * d);
          const common = gcd(num, d);
          if (d / common === 1) {
            const n = num / common;
            if (n === 1 && i > 0) frac = '';
            else frac = `${n}`;
          } else {
            frac = String.raw`\frac{${num / common}}{${d / common}}`;
          }
          break;
        }
      }
      cStr = sign + (frac || absC.toFixed(2));
    }

    const term = (i === 0 ? '' : (i === 1 ? varName : `${varName}^{${i}}`));
    res += cStr + term;
  }
  return res || '0';
};

const fmtPolyK = (coeffs) => fmtPolynomial(coeffs, 'k');

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
      
      // S = N/2 * (a(N+1) + 2b) = a/2 N^2 + (a/2 + b) N
      // Coefficients of n^2, n, 1
      const C2 = a/2;
      const C1 = a/2 + b;
      
      const expandLimitAtN = (limitTex, c2, c1) => {
          if (limitTex === 'n') return [0, c1, c2];
          const x = (limitTex === 'n-1' ? -1 : 1);
          const res = [0, 0, 0];
          // c2(n+x)^2 + c1(n+x) = c2(n^2 + 2xn + x^2) + c1(n + x)
          // = c2 n^2 + (2c2x + c1) n + (c2x^2 + c1x)
          res[2] = c2;
          res[1] = 2*c2*x + c1;
          res[0] = c2*x*x + c1*x;
          return res;
      };
      
      return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C2, C1)) };
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
    if (type === 1) { // Cubic Polynomial ak^3 + bk^2 + ck + d
      let a = getRandomNonZeroInt(-2, 2) * 2;
      let b = getRandomInt(-2, 2) * 3;
      let c = getRandomInt(-2, 2) * 2;
      let d = getRandomInt(-3, 3);
      
      const q = texSigma(wrapMath(fmtPolyK([d, c, b, a])), nTex);
      
      // Coefficients of n^4, n^3, n^2, n, 1
      // S(N) = a/4 N^4 + (a/2+b/3)N^3 + (a/4+b/2+c/2)N^2 + (b/6+c/2+d)N
      const C = [0, b/6+c/2+d, a/4+b/2+c/2, a/2+b/3, a/4];
      
      const expandLimitAtN = (limitTex, CC) => {
          if (limitTex === 'n') return CC;
          const x = (limitTex === 'n-1' ? -1 : 1);
          const res = [0, 0, 0, 0, 0];
          // res += CC[j] * (n+x)^j
          for (let j = 0; j <= 4; j++) {
            if (CC[j] === 0) continue;
            // (n+x)^j expansion
            if (j === 0) res[0] += CC[j];
            if (j === 1) { res[1] += CC[j]; res[0] += CC[j]*x; }
            if (j === 2) { res[2] += CC[j]; res[1] += CC[j]*2*x; res[0] += CC[j]*x*x; }
            if (j === 3) { res[3] += CC[j]; res[2] += CC[j]*3*x; res[1] += CC[j]*3*x*x; res[0] += CC[j]*x*x*x; }
            if (j === 4) { res[4] += CC[j]; res[3] += CC[j]*4*x; res[2] += CC[j]*6*x*x; res[1] += CC[j]*4*x*x*x; res[0] += CC[j]*x*x*x*x; }
          }
          return res;
      };
      
      return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C)) };
    } else if (type === 2) { // (ak+b)(ck+d) product
      let a = getRandomNonZeroInt(-2, 2), b = getRandomInt(-3, 3);
      let c = getRandomNonZeroInt(-2, 2), d = getRandomInt(-3, 3);
      const tt1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const tt2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const q = texSigma(String.raw`${wrapMath(tt1)} ${wrapMath(tt2)}`, nTex);
      
      // (ak+b)(ck+d) = ack^2 + (ad+bc)k + bd
      const ac = a * c, adbc = a * d + b * c, bd = b * d;
      // S2 coefficients: n^3:1/3, n^2:1/2, n^1:1/6
      const C = [0, adbc/2 + bd + ac/6, ac/2 + adbc/2, ac/3];
      
      const expandLimitAtN = (limitTex, CC) => {
          if (limitTex === 'n') return CC;
          const x = (limitTex === 'n-1' ? -1 : 1);
          const res = [0, 0, 0, 0];
          for (let j = 0; j <= 3; j++) {
            if (CC[j] === 0) continue;
            if (j === 0) res[0] += CC[j];
            if (j === 1) { res[1] += CC[j]; res[0] += CC[j]*x; }
            if (j === 2) { res[2] += CC[j]; res[1] += CC[j]*2*x; res[0] += CC[j]*x*x; }
            if (j === 3) { res[3] += CC[j]; res[2] += CC[j]*3*x; res[1] += CC[j]*3*x*x; res[0] += CC[j]*x*x*x; }
          }
          return res;
      };
      
      return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C)) };
    } else if (type === 3) { // (k+a)^3
      const aVal = getRandomNonZeroInt(-3, 3);
      const q = texSigma(String.raw`${wrapMath(String.raw`k${aVal>0?'+'+aVal:aVal}`)}^3`, nTex);
      // (k+a)^3 = k^3 + 3ak^2 + 3a^2k + a^3
      const a = 1, b = 3*aVal, c = 3*aVal*aVal, d = aVal*aVal*aVal;
      const C = [0, b/6+c/2+d, a/4+b/2+c/2, a/2+b/3, a/4];
      
      const expandLimitAtN = (limitTex, CC) => {
          if (limitTex === 'n') return CC;
          const x = (limitTex === 'n-1' ? -1 : 1);
          const res = [0, 0, 0, 0, 0];
          for (let j = 0; j <= 4; j++) {
            if (CC[j] === 0 || isNaN(CC[j])) continue;
            if (j === 0) res[0] += CC[j];
            if (j === 1) { res[1] += CC[j]; res[0] += CC[j]*x; }
            if (j === 2) { res[2] += CC[j]; res[1] += CC[j]*2*x; res[0] += CC[j]*x*x; }
            if (j === 3) { res[3] += CC[j]; res[2] += CC[j]*3*x; res[1] += CC[j]*3*x*x; res[0] += CC[j]*x*x*x; }
            if (j === 4) { res[4] += CC[j]; res[3] += CC[j]*4*x; res[2] += CC[j]*6*x*x; res[1] += CC[j]*4*x*x*x; res[0] += CC[j]*x*x*x*x; }
          }
          return res;
      };
      return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C)) };
    } else {
      const sub = getRandomInt(1, 2);
      if (sub === 1) { // sum k(k+1) = n(n+1)(n+2)/3
        const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}`, nTex);
        const ans = String.raw`\frac{1}{3}${fmtProduct([nMath, N.np1, N.np2])}`;
        return { question: q, answer: ans };
      } else { // sum k(k+1)(k+2) = n(n+1)(n+2)(n+3)/4
        const q = texSigma(String.raw`k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}`, nTex);
        const ans = String.raw`\frac{${fmtProduct([nMath, N.np1, N.np2, N.np3])}}{4}`;
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
          const ans = String.raw`${cstr}n\left(n-1\right)`;
          return { question: q, answer: ans };
      } else { // n+1
          const bV = (2 + a);
          const cV = 2 * a;
          const inner = simplifyFactor(bV, cV, 'n');
          return { question: q, answer: String.raw`\frac{\left(n+1\right)\left(${inner}\right)}{2}` };
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
    } else if (type === 3) { // (2k-1)(2k+1) => N(4N^2+6N-1)/3 = 4/3 N^3 + 2N^2 - 1/3 N
      const q = texSigma(String.raw`${wrapMath(String.raw`2k-1`)}${wrapMath(String.raw`2k+1`)}`, nTex);
      const C = [0, -1/3, 2, 4/3];
      const expandLimitAtN = (limitTex, CC) => {
          if (limitTex === 'n') return CC;
          const x = (limitTex === 'n-1' ? -1 : 1);
          const res = [0, 0, 0, 0];
          for (let j = 0; j <= 3; j++) {
            if (CC[j] === 0) continue;
            if (j === 0) res[0] += CC[j];
            if (j === 1) { res[1] += CC[j]; res[0] += CC[j]*x; }
            if (j === 2) { res[2] += CC[j]; res[1] += CC[j]*2*x; res[0] += CC[j]*x*x; }
            if (j === 3) { res[3] += CC[j]; res[2] += CC[j]*3*x; res[1] += CC[j]*3*x*x; res[0] += CC[j]*x*x*x; }
          }
          return res;
      };
      return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C)) };
    } else { // (3k-2)(3k+1) or (3k-1)(3k+2)
      const sub = getRandomInt(1, 2);
      if (sub === 1) { // (3k-2)(3k+1) => N(3N^2+3N-2) = 3N^3 + 3N^2 - 2N
        const q = texSigma(String.raw`${wrapMath(String.raw`3k-2`)}${wrapMath(String.raw`3k+1`)}`, nTex);
        const C = [0, -2, 3, 3];
        const expandLimitAtN = (limitTex, CC) => {
            if (limitTex === 'n') return CC;
            const x = (limitTex === 'n-1' ? -1 : 1);
            const res = [0, 0, 0, 0];
            for (let j = 0; j <= 3; j++) {
              if (CC[j] === 0) continue;
              if (j === 0) res[0] += CC[j];
              if (j === 1) { res[1] += CC[j]; res[0] += CC[j]*x; }
              if (j === 2) { res[2] += CC[j]; res[1] += CC[j]*2*x; res[0] += CC[j]*x*x; }
              if (j === 3) { res[3] += CC[j]; res[2] += CC[j]*3*x; res[1] += CC[j]*3*x*x; res[0] += CC[j]*x*x*x; }
            }
            return res;
        };
        return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C)) };
      } else { // (3k-1)(3k+2) => N(3N^2+6N+1) = 3N^3 + 6N^2 + N
        const q = texSigma(String.raw`${wrapMath(String.raw`3k-1`)}${wrapMath(String.raw`3k+2`)}`, nTex);
        const C = [0, 1, 6, 3];
        const expandLimitAtN = (limitTex, CC) => {
            if (limitTex === 'n') return CC;
            const x = (limitTex === 'n-1' ? -1 : 1);
            const res = [0, 0, 0, 0];
            for (let j = 0; j <= 3; j++) {
              if (CC[j] === 0) continue;
              if (j === 0) res[0] += CC[j];
              if (j === 1) { res[1] += CC[j]; res[0] += CC[j]*x; }
              if (j === 2) { res[2] += CC[j]; res[1] += CC[j]*2*x; res[0] += CC[j]*x*x; }
              if (j === 3) { res[3] += CC[j]; res[2] += CC[j]*3*x; res[1] += CC[j]*3*x*x; res[0] += CC[j]*x*x*x; }
            }
            return res;
        };
        return { question: q, answer: fmtPolynomial(expandLimitAtN(nTex, C)) };
      }
    }
  },

  level5: () => {
    const N = getUpperLimit();
    const nMath = N.expr;
    const nTex = N.tex;
    const type = getRandomInt(1, 6);
    if (type === 1) { // 1/k(k+1)
      const q = texSigma(String.raw`\frac{1}{k\left( k+1 \right)}`, nTex);
      return { question: q, answer: String.raw`\frac{${N.n}}{${N.np1}}` };
    } else if (type === 2) { // 1/(k+1)(k+2)
      const q = texSigma(String.raw`\frac{1}{\left( k+1 \right)\left( k+2 \right)}`, nTex);
      return { question: q, answer: String.raw`\frac{${N.n}}{2\left( ${N.np2} \right)}` };
    } else if (type === 3) { // 1/k(k+1)(k+2)
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+1`)}${wrapMath(String.raw`k+2`)}}`, nTex);
      return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, N.np3])}}{4${fmtProduct([N.np1, N.np2])}}` };
    } else if (type === 4) { // 1/k(k+2)
      const q = texSigma(String.raw`\frac{1}{k${wrapMath(String.raw`k+2`)}}`, nTex);
      const innerStr = (nTex === 'n' ? '3n+5' : (nTex === 'n-1' ? '3n+2' : '3n+8'));
      return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, innerStr])}}{4${fmtProduct([N.np1, N.np2])}}` };
    } else if (type === 5) { // 1/(k^2+ak)
      const aVal = getRandomInt(1, 2);
      const q = texSigma(String.raw`\frac{1}{${fmtPolyK([0, aVal, 1])}}`, nTex);
      if (aVal === 1) return { question: q, answer: String.raw`\frac{${N.n}}{${N.np1}}` };
      const innerStr = (nTex === 'n' ? '3n+5' : (nTex === 'n-1' ? '3n+2' : '3n+8'));
      return { question: q, answer: String.raw`\frac{${fmtProduct([N.n, innerStr])}}{4${fmtProduct([N.np1, N.np2])}}` };
    } else { // 1/(2k+a)(2k+a+2)
      const aSub = [ -1, 1, 3 ][getRandomInt(0, 2)];
      const q = texSigma(String.raw`\frac{1}{${wrapMath(simplifyFactor(2, aSub, 'k'))}${wrapMath(simplifyFactor(2, aSub+2, 'k'))}}`, nTex);
      const denOuter = 2 + aSub;
      const bV = 2;
      const cV = (nTex==='n'? aSub+2 : (nTex==='n-1'? aSub : aSub+4));
      const denInner = simplifyFactor(bV, cV, 'n');
      return { question: q, answer: String.raw`\frac{${N.n}}{${denOuter}${wrapMath(denInner)}}` };
    }
  },

  level6: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const r = Math.random() < 0.5 ? 2 : 3;
    const q = texSigma(String.raw`k \cdot ${r}^{k}`, nTex);
    if (r === 2) {
        // N=n: 2^{n+1}(n-1)+2
        // N=n-1: 2^n(n-2)+2
        // N=n+1: 2^{n+2}n+2
        if (nTex === 'n') return { question: q, answer: String.raw`2^{n+1}\left(n-1\right)+2` };
        if (nTex === 'n-1') return { question: q, answer: String.raw`2^{n}\left(n-2\right)+2` };
        return { question: q, answer: String.raw`2^{n+2}n+2` };
    } else { // r=3
        // N=n: 3/4 (3^n(2n-1)+1)
        // N=n-1: 3/4 (3^{n-1}(2n-3)+1)
        // N=n+1: 3/4 (3^{n+1}(2n+1)+1)
        if (nTex === 'n') return { question: q, answer: String.raw`\frac{3\left\{3^{n}\left(2n-1\right)+1\right\}}{4}` };
        if (nTex === 'n-1') return { question: q, answer: String.raw`\frac{3\left\{3^{n-1}\left(2n-3\right)+1\right\}}{4}` };
        return { question: q, answer: String.raw`\frac{3\left\{3^{n+1}\left(2n+1\right)+1\right\}}{4}` };
    }
  },

  level7: () => {
    const N = getUpperLimit();
    const nTex = N.tex;
    const nMath = N.expr;
    const type = getRandomInt(1, 4);

    if (type === 1) { // sum k^2 / (2k-1)(2k+1) = n(n+1) / 2(2n+1)
      const q = texSigma(String.raw`\frac{k^2}{\left( 2k-1 \right)\left( 2k+1 \right)}`, nTex);
      const denInner = simplifyFactor(2, 1, 'n');
      const ans = String.raw`\frac{${fmtProduct([nMath, N.np1])}}{2${wrapMath(denInner)}}`;
      return { question: q, answer: ans };
    } else if (type === 2) { // sum 2^k(1-k) / k(k+1) = 2 - 2^{n+1}/(n+1)
      const q = texSigma(String.raw`\frac{2^k\left( 1-k \right)}{k\left( k+1 \right)}`, nTex);
      const ans = String.raw`2 - \frac{2^{${N.np1}}}{${N.np1}}`;
      return { question: q, answer: ans };
    } else if (type === 3) { // sum (2k+1) / k(k+1)(k+2) = n(5n+7) / 4(n+1)(n+2)
      const q = texSigma(String.raw`\frac{2k+1}{k\left( k+1 \right)\left( k+2 \right)}`, nTex);
      const term2 = simplifyFactor(5, 7, 'n');
      const ans = String.raw`\frac{${fmtProduct([nMath, term2])}}{4${fmtProduct([N.np1, N.np2])}}`;
      return { question: q, answer: ans };
    } else { // sum (2k+1) / k^2(k+1)^2 = n(n+2) / (n+1)^2
      const q = texSigma(String.raw`\frac{2k+1}{k^2 \left( k+1 \right)^2}`, nTex);
      const ans = String.raw`\frac{${fmtProduct([nMath, N.np2])}}{\left( ${N.np1} \right)^2}`;
      return { question: q, answer: ans };
    }
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
