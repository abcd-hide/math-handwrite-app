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

const texSigma = (exprTex, upperTex) => `\\displaystyle\\sum_{k=1}^{${upperTex}} ${exprTex}`;

const fmtTerm = (c, v, first = false) => {
  if (c === 0) return "";
  if (c === 1 && v) return first ? v : `+${v}`;
  if (c === -1 && v) return `-${v}`;
  if (c > 0) return first ? `${c}${v}` : `+${c}${v}`;
  return `${c}${v}`;
};

export const sequenceSumGenerators = {
  level1: () => {
    if (Math.random() < 0.5) {
      const a = getRandomInt(-5, 5);
      const b = getRandomInt(-5, 5);
      if (a === 0 && b === 0) return sequenceSumGenerators.level1();
      
      let termTex = "";
      if (a === 0) { termTex = `${b}`; }
      else if (b === 0) { termTex = a === 1 ? 'k' : (a === -1 ? '-k' : `${a}k`); }
      else {
        termTex = a === 1 ? 'k' : (a === -1 ? '-k' : `${a}k`);
        termTex += b > 0 ? `+${b}` : `${b}`;
      }
      const exprTex = (a !== 0 && b !== 0) ? `(${termTex})` : termTex;
      
      const N = getUpperLimit();
      const n = N.expr;
      const q = texSigma(exprTex, N.tex);
      const ans = `${a} * ${n} * (${n} + 1) / 2 + ${b} * ${n}`;
      return { question: q, answer: ans };
    } else {
      let a;
      while (true) { a = getRandomInt(-5, 5); if (a !== 0 && Math.abs(a) !== 1) break; }
      let b = Math.random() < 0.3 ? 0 : getRandomInt(-3, 3);
      let c;
      while (true) { c = getRandomInt(-5, 5); if (c !== 0) break; }
      
      const aTex = a < 0 ? `(${a})` : `${a}`;
      const cTex = c === 1 ? '' : (c === -1 ? '-' : `${c} \\cdot `);
      const bTex = b === 0 ? 'k' : (b > 0 ? `k+${b}` : `k${b}`);
      const exprTex = `${cTex}${aTex}^{${bTex}}`;
      
      const N = getUpperLimit();
      const n = N.expr;
      const q = texSigma(exprTex, N.tex);
      const aMath = a < 0 ? `(${a})` : a;
      const ans = `${c} * ${aMath}^(1+${b}) * (${aMath}^${n} - 1) / (${aMath} - 1)`;
      return { question: q, answer: ans };
    }
  },
  level2: () => {
    const type = getRandomInt(1, 5);
    const N = getUpperLimit();
    const n = N.expr;
    
    if (type === 1) {
      let a = getRandomInt(-3, 3), b = getRandomInt(-3, 3), c = getRandomInt(-5, 5), d = getRandomInt(-5, 5);
      if (a === 0 && b === 0) return sequenceSumGenerators.level2();
      let term = '';
      term += fmtTerm(a, 'k^3', true);
      term += term === '' ? fmtTerm(b, 'k^2', true) : fmtTerm(b, 'k^2');
      term += term === '' ? fmtTerm(c, 'k', true) : fmtTerm(c, 'k');
      term += term === '' ? fmtTerm(d, '', true) : fmtTerm(d, '');
      const q = texSigma(`(${term})`, N.tex);
      const ans = `${a} * (${n}*(${n}+1)/2)^2 + ${b} * ${n}*(${n}+1)*(2*${n}+1)/6 + ${c} * ${n}*(${n}+1)/2 + ${d} * ${n}`;
      return { question: q, answer: ans };
    } else if (type === 2) {
      let a = getRandomNonZeroInt(-3, 3), b = getRandomInt(-4, 4);
      let c = getRandomNonZeroInt(-3, 3), d = getRandomInt(-4, 4);
      const term1 = `${a===1?'k':(a===-1?'-k':a+'k')}${b>0?'+'+b:(b<0?b:'')}`;
      const term2 = `${c===1?'k':(c===-1?'-k':c+'k')}${d>0?'+'+d:(d<0?d:'')}`;
      const isSquare = (a===c && b===d);
      const q = texSigma(isSquare ? `(${term1})^2` : `(${term1})(${term2})`, N.tex);
      const ac = a*c, ad_bc = a*d + b*c, bd = b*d;
      const ans = `${ac} * ${n}*(${n}+1)*(2*${n}+1)/6 + ${ad_bc} * ${n}*(${n}+1)/2 + ${bd} * ${n}`;
      return { question: q, answer: ans };
    } else if (type === 3) {
      let a = getRandomNonZeroInt(-4, 4);
      const term = `(k${a>0?'+'+a:a})^3`;
      const q = texSigma(term, N.tex);
      const ans = `(${n}*(${n}+1)/2)^2 + 3*${a}*${n}*(${n}+1)*(2*${n}+1)/6 + 3*${a}^2*${n}*(${n}+1)/2 + ${a}^3*${n}`;
      return { question: q, answer: ans };
    } else if (type === 4) {
      const subType = getRandomInt(1, 3);
      if (subType === 1) {
        const q = texSigma('k(k-1)(k-2)', N.tex);
        const ans = `(${n}+1)*${n}*(${n}-1)*(${n}-2) / 4`;
        return { question: q, answer: ans };
      } else if (subType === 2) {
        const q = texSigma('k(k-1)(k+1)', N.tex);
        const ans = `(${n}*(${n}+1)/2)^2 - ${n}*(${n}+1)/2`;
        return { question: q, answer: ans };
      } else {
        const q = texSigma('k(k+1)(k+2)', N.tex);
        const ans = `${n}*(${n}+1)*(${n}+2)*(${n}+3) / 4`;
        return { question: q, answer: ans };
      }
    } else {
      if (Math.random() < 0.5) {
        const q = texSigma('k(k-1)', N.tex);
        const ans = `${n}*(${n}+1)*(2*${n}+1)/6 - ${n}*(${n}+1)/2`;
        return { question: q, answer: ans };
      } else {
        const q = texSigma('k(k+1)', N.tex);
        const ans = `${n}*(${n}+1)*(2*${n}+1)/6 + ${n}*(${n}+1)/2`;
        return { question: q, answer: ans };
      }
    }
  },
  level3: () => {
    const isDouble = Math.random() < 0.5;
    if (!isDouble) {
      const N = getUpperLimit();
      const a = getRandomInt(-2, 2);
      const b = getRandomNonZeroInt(-3, 3);
      let termTex = `(${b}k + n)`;
      const ans = `${b}*${N.expr}*(${N.expr}+1)/2 + n*${N.expr}`;
      return { question: texSigma(termTex, N.tex), answer: ans };
    } else {
      const N = getUpperLimit();
      const n = N.expr;
      const q = `\\displaystyle\\sum_{k=1}^{${N.tex}}\\left(\\sum_{\\ell=1}^{${N.tex}}k\\ell\\right)`;
      const sum1 = `${n}*(${n}+1)/2`;
      const ans = `(${sum1}) * (${sum1})`;
      return { question: q, answer: ans };
    }
  },
  level4: () => {
    return sequenceSumGenerators.level2(); // Placeholder, similar to L2
  },
  level5: () => {
    const N = getUpperLimit();
    const type = getRandomInt(1, 3);
    if (type === 1) {
       const a = getRandomInt(1, 2);
       const expr = `\\frac{1}{k^2+${a===1?'':'2'}k}`;
       const q = texSigma(expr, N.tex);
       let ans = '';
       if (a === 1) ans = `1 - 1/(${N.expr}+1)`;
       else ans = `(1/2) * (1 + 1/2 - 1/(${N.expr}+1) - 1/(${N.expr}+2))`;
       return { question: q, answer: ans };
    }
    return sequenceSumGenerators.level2();
  },
  level6: () => {
    return sequenceSumGenerators.level2();
  },
  level7: () => {
    return sequenceSumGenerators.level2();
  },
  level8: () => {
    return sequenceSumGenerators.level2();
  }
};
