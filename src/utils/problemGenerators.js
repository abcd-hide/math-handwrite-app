/**
 * 因数分解の問題生成ロジック
 */

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomNonZeroInt = (min, max) => {
  let res = 0;
  while (res === 0) res = getRandomInt(min, max);
  return res;
};

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
};

// 定数項の処理
const fmtConst = (n, first = false) => {
  if (n === 0 || n === undefined) return "";
  if (n > 0) return first ? `${n}` : `+${n}`;
  return `${n}`;
};

// 係数の処理 (1, -1 の場合に数字を省略する)
const fmtCoeff = (n, first = false) => {
  if (n === undefined || n === 0) return "";
  if (n === 1) return first ? "" : "+";
  if (n === -1) return "-";
  if (n > 0) return first ? `${n}` : `+${n}`;
  return `${n}`;
};

const fmtTerm = (coeff, term, first = false) => {
  if (coeff === 0 || coeff === undefined) return "";
  return `${fmtCoeff(coeff, first)}${term}`;
};

/**
 * 多項式を文字列化する (変数 -> 定数項の順)
 */
const stringifyPoly = (terms, targetVars) => {
  let res = "";
  let first = true;
  targetVars.forEach(v => {
    if (terms[v] !== undefined && terms[v] !== 0) {
      res += fmtTerm(terms[v], v, first);
      first = false;
    }
  });
  const cVal = terms.const || 0;
  if (cVal !== 0 || res === "") {
    res += fmtConst(cVal, first);
  }
  return res;
};

/**
 * 因数をまとめて指数表記にする
 */
const formatFactors = (factors, leading = "") => {
  const counts = {};
  factors.forEach(f => {
    if (!f) return;
    const key = (f.includes('+') || f.includes('-')) && !f.startsWith('(') ? `(${f})` : f;
    counts[key] = (counts[key] || 0) + 1;
  });
  
  const body = Object.entries(counts)
    .sort(([a], [b]) => {
      const aIsPoly = a.includes('+') || a.includes('-');
      const bIsPoly = b.includes('+') || b.includes('-');
      if (aIsPoly && !bIsPoly) return 1;
      if (!aIsPoly && bIsPoly) return -1;
      return a.localeCompare(b);
    })
    .map(([f, count]) => {
      if (count === 1) return f;
      return `${f}^${count}`;
    }).join("");
  
  return leading + body;
};

const variableGroups = [
  ['x', 'y', 'z'],
  ['a', 'b', 'c'],
  ['p', 'q', 'r'],
  ['s', 't', 'u'],
  ['k', 'm', 'n']
];

const getRandGroup = () => variableGroups[getRandomInt(0, variableGroups.length - 1)];

class PatternQueue {
  constructor(patterns) {
    this.patterns = patterns;
    this.queue = [];
    this.isRandomPhase = false;
  }
  next() {
    if (this.isRandomPhase) {
      return this.patterns[Math.floor(Math.random() * this.patterns.length)];
    }
    if (this.queue.length === 0) {
      this.queue = [...this.patterns].sort(() => Math.random() - 0.5);
    }
    const val = this.queue.pop();
    if (this.queue.length === 0) {
      this.isRandomPhase = true;
    }
    return val;
  }
}

const levelQueues = {
  level1: new PatternQueue([
    { numTerms: 2, commonType: 1 }, { numTerms: 2, commonType: 2 }, { numTerms: 2, commonType: 3 },
    { numTerms: 3, commonType: 1 }, { numTerms: 3, commonType: 2 }, { numTerms: 3, commonType: 3 }
  ]),
  level2: new PatternQueue([
    { subType: 1, isHomogeneous: true }, { subType: 1, isHomogeneous: false },
    { subType: 2, isHomogeneous: true }, { subType: 2, isHomogeneous: false },
    { subType: 3, isHomogeneous: true }, { subType: 3, isHomogeneous: false }
  ]),
  level3: new PatternQueue([
    { isHomogeneous: true }, { isHomogeneous: false }
  ]),
  level4: new PatternQueue([
    { baseLevel: 1 }, { baseLevel: 2, subType: 1 }, { baseLevel: 2, subType: 2 }, { baseLevel: 2, subType: 3 }, { baseLevel: 3 }
  ]),
  level5: new PatternQueue([0, 1, 2, 3, 4, 5, 6, 7]),
  level6: new PatternQueue([1, 2, 3, 4, 5, 6]),
  level7: new PatternQueue([1, 2]),
  level8: new PatternQueue([1, 2, 3, 4, 5, 6])
};

export const problemGenerators = {
  factorization: {
    // レベル1: 中学くくりだし
    level1: () => {
      const g = getRandGroup();
      const v = [...g];
      const p = levelQueues.level1.next();
      const numTerms = p.numTerms;
      const commonType = p.commonType;
      let cfNum = 1, cfVar = "";
      if (commonType === 1 || commonType === 3) {
        cfNum = getRandomNonZeroInt(-6, 6);
        if (cfNum === 1 || cfNum === -1) cfNum = (cfNum > 0 ? 2 : -2);
      }
      if (commonType === 2 || commonType === 3) cfVar = v[0];

      let cArray = [];
      while (true) {
        cArray = [];
        let currentGcd = 0;
        for (let i = 0; i < numTerms; i++) {
          let c = getRandomNonZeroInt(-4, 4);
          if (i === 0) c = Math.abs(c);
          cArray.push(c);
          currentGcd = (i === 0) ? Math.abs(c) : gcd(currentGcd, c);
        }
        if (currentGcd === 1) break;
      }

      const terms = [];
      for (let i = 0; i < numTerms; i++) {
        let tVar = v[i];
        if (i === 0 && commonType === 2) tVar = v[0];
        terms.push({ c: cArray[i], v: tVar });
      }

      let q = "", innerPoly = { const: 0 };
      const vars = [...new Set(terms.map(t => t.v).filter(x => x))];
      terms.forEach((t, i) => {
        const finalC = cfNum * t.c;
        const finalV = (cfVar && t.v === cfVar) ? `${cfVar}^2` : `${cfVar}${t.v}`;
        q += fmtTerm(finalC, finalV, i === 0);
        if (t.v === "") innerPoly.const += t.c;
        else innerPoly[t.v] = (innerPoly[t.v] || 0) + t.c;
      });

      const leading = (cfNum === 1 && cfVar) ? cfVar : 
                     (cfNum === -1 && cfVar) ? `-${cfVar}` :
                     (cfNum === 1 && !cfVar) ? "" :
                     (cfNum === -1 && !cfVar) ? "-" :
                     `${cfNum}${cfVar}`;
      
      const innerStr = stringifyPoly(innerPoly, vars);
      const ans = formatFactors([innerStr], leading);
      return { question: q, answer: ans };
    },

    // レベル2: 中学公式
    level2: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1];
      const p = levelQueues.level2.next();
      const isHomogeneous = p.isHomogeneous;
      const subType = p.subType;
      
      if (subType === 1) { // (x+a)(x+b)
        const a = getRandomNonZeroInt(-6, 6);
        let b = getRandomNonZeroInt(-6, 6);
        if (a === b) b += 1;
        const q = isHomogeneous ? `${v1}^2${fmtTerm(a + b, v1 + v2)}${fmtTerm(a * b, v2 + '^2')}` : `${v1}^2${fmtTerm(a + b, v1)}${fmtConst(a * b)}`;
        const f1 = isHomogeneous ? stringifyPoly({ [v1]: 1, [v2]: a }, [v1, v2]) : stringifyPoly({ [v1]: 1, const: a }, [v1]);
        const f2 = isHomogeneous ? stringifyPoly({ [v1]: 1, [v2]: b }, [v1, v2]) : stringifyPoly({ [v1]: 1, const: b }, [v1]);
        return { question: q, answer: formatFactors([f1, f2]) };
      } else if (subType === 2) { // (x+a)^2
        const a = getRandomNonZeroInt(-6, 6);
        const q = isHomogeneous ? `${v1}^2${fmtTerm(2 * a, v1 + v2)}${fmtTerm(a * a, v2 + '^2')}` : `${v1}^2${fmtTerm(2 * a, v1)}${fmtConst(a * a)}`;
        const f = isHomogeneous ? stringifyPoly({ [v1]: 1, [v2]: a }, [v1, v2]) : stringifyPoly({ [v1]: 1, const: a }, [v1]);
        return { question: q, answer: formatFactors([f, f]) };
      } else { // x^2 - a^2
        const a = getRandomInt(2, 10);
        const q = isHomogeneous ? `${v1}^2${fmtTerm(-a * a, v2 + '^2')}` : `${v1}^2${fmtConst(-a * a)}`;
        const f1 = isHomogeneous ? stringifyPoly({ [v1]: 1, [v2]: a }, [v1, v2]) : stringifyPoly({ [v1]: 1, const: a }, [v1]);
        const f2 = isHomogeneous ? stringifyPoly({ [v1]: 1, [v2]: -a }, [v1, v2]) : stringifyPoly({ [v1]: 1, const: -a }, [v1]);
        return { question: q, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル3: たすきがけ
    level3: () => {
      const g = getRandGroup();
      const v = g[0], v2 = g[1];
      const p = levelQueues.level3.next();
      const isHomogeneous = p.isHomogeneous;
      let a, b, c, d;
      while(true) {
        a = getRandomNonZeroInt(-3, 3); b = getRandomNonZeroInt(-5, 5);
        c = getRandomNonZeroInt(-3, 3); d = getRandomNonZeroInt(-5, 5);
        if (a*c !== 0 && (a !== c || b !== d)) break;
      }
      const q = isHomogeneous ? `${fmtTerm(a * c, v + '^2', true)} ${fmtTerm(a * d + b * c, v + v2)} ${fmtTerm(b * d, v2 + '^2')}`
                              : `${fmtTerm(a * c, v + '^2', true)} ${fmtTerm(a * d + b * c, v)} ${fmtConst(b * d)}`;
      const f1 = isHomogeneous ? stringifyPoly({ [v]: a, [v2]: b }, [v, v2]) : stringifyPoly({ [v]: a, const: b }, [v]);
      const f2 = isHomogeneous ? stringifyPoly({ [v]: c, [v2]: d }, [v, v2]) : stringifyPoly({ [v]: c, const: d }, [v]);
      return { question: q, answer: formatFactors([f1, f2]) };
    },

    // レベル4: 置き換え (ax+by 形式)
    level4: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1];
      
      const makeTerm = (vX, vY) => {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        let a, b;
        while(true) {
          a = getRandomInt(-3, 3); b = getRandomInt(-3, 3);
          if ((a !== 0 || b !== 0) && gcd(Math.abs(a), Math.abs(b)) === 1) break;
          if (a === 1 && b === 0) continue;
          if (a === 0 && b === 1) continue;
        }
        return { a, b, str: stringifyPoly({ [vX]: a, [vY]: b }, [vX, vY]) };
      };

      const X = makeTerm(v1, v2);
      const p = levelQueues.level4.next();
      const baseLevel = p.baseLevel;

      if (baseLevel === 1) { // leading(X+a)(X+b)
        const k = getRandomNonZeroInt(-3, 3);
        const a = getRandomNonZeroInt(-4, 4);
        const b = getRandomNonZeroInt(-4, 4);
        const q = `${fmtTerm(k, `(${X.str})^2`, true)}${fmtTerm(k*(a+b), `(${X.str})`)}${fmtConst(k*a*b)}`;
        const f1 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: a }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: b }, [v1, v2]);
        return { question: q, answer: formatFactors([f1, f2], k === 1 ? "" : (k === -1 ? "-" : k)) };
      } else if (baseLevel === 2) { // (X+a)(X+b) etc
        const subType = p.subType;
        if (subType === 1) {
          const a = getRandomNonZeroInt(-5, 5);
          let b = getRandomNonZeroInt(-5, 5); if (a === b) b++;
          const q = `(${X.str})^2${fmtTerm(a+b, `(${X.str})`)}${fmtConst(a*b)}`;
          const f1 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: a }, [v1, v2]);
          const f2 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: b }, [v1, v2]);
          return { question: q, answer: formatFactors([f1, f2]) };
        } else if (subType === 2) {
          const a = getRandomNonZeroInt(-5, 5);
          const q = `(${X.str})^2${fmtTerm(2*a, `(${X.str})`)}${fmtConst(a*a)}`;
          const f = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: a }, [v1, v2]);
          return { question: q, answer: formatFactors([f, f]) };
        } else {
          const a = getRandomInt(2, 8);
          const q = `(${X.str})^2${fmtConst(-a*a)}`;
          const f1 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: a }, [v1, v2]);
          const f2 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: -a }, [v1, v2]);
          return { question: q, answer: formatFactors([f1, f2]) };
        }
      } else { //たすきがけ
        const a=getRandomNonZeroInt(-2, 2), b=getRandomNonZeroInt(-3, 3);
        const c=getRandomNonZeroInt(-2, 2), d=getRandomNonZeroInt(-3, 3);
        const q = `${fmtTerm(a*c, `(${X.str})^2`, true)}${fmtTerm(a*d+b*c, `(${X.str})`)}${fmtConst(b*d)}`;
        const f1 = stringifyPoly({ [v1]: a*X.a, [v2]: a*X.b, const: b }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: c*X.a, [v2]: c*X.b, const: d }, [v1, v2]);
        return { question: q, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル5: 最低次数について整理
    level5: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1], v3 = g[2];
      const type = levelQueues.level5.next();

      if (type === 0) {
        // パターン0: kxy + kcy + x^2 + (c+d)x + cd => (x+c)(x+d+ky)
        const k = getRandomNonZeroInt(-3, 3);
        const c = getRandomNonZeroInt(-4, 4);
        const d = getRandomNonZeroInt(-4, 4);
        const q = `${fmtTerm(k, v1+v2, true)} ${fmtTerm(k*c, v2)} + ${v1}^2 ${fmtTerm(c+d, v1)} ${fmtConst(c*d)}`;
        const f1 = stringifyPoly({ [v1]: 1, [v2]: k, const: d }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: 1, const: c }, [v1]);
        return { question: q, answer: formatFactors([f1, f2]) };
      } else if (type === 1) {
        // パターン1: 2a^2b - 8ab + 8b => k*v2*v1^2 + 2*p*k*v1*v2 + p^2*k*v2 => k v2 (v1 + p)^2
        const k = getRandomNonZeroInt(-3, 3);
        const p = getRandomNonZeroInt(-4, 4);
        const qStr = `${fmtTerm(k, v1+'^2'+v2, true)} ${fmtTerm(2*p*k, v1+v2)} ${fmtTerm(p*p*k, v2)}`;
        const f1 = stringifyPoly({ [v1]: 1, const: p }, [v1]);
        return { question: qStr, answer: formatFactors([v2, f1, f1], k === 1 ? "" : (k === -1 ? "-" : k)) };
      } else if (type === 2) {
        // パターン2: ax - by + ay - bx => (v1 + n v2)(v3 + m v4) => v1 v3 + m v1 v4 + n v2 v3 + m n v2 v4
        const m = getRandomNonZeroInt(-3, 3);
        const n = getRandomNonZeroInt(-3, 3);
        let g2 = getRandGroup();
        while (g2 === g) g2 = getRandGroup();
        const v4 = g2[0], v5 = g2[1];
        const terms = [
          { c: 1, v: v1+v4 },
          { c: m, v: v1+v5 },
          { c: n, v: v2+v4 },
          { c: m*n, v: v2+v5 }
        ].sort(() => Math.random() - 0.5);
        let qStr = "";
        terms.forEach((t, i) => { qStr += (i > 0 ? " " : "") + fmtTerm(t.c, t.v, i === 0); });
        const f1 = stringifyPoly({ [v1]: 1, [v2]: n }, [v1, v2]);
        const f2 = stringifyPoly({ [v4]: 1, [v5]: m }, [v4, v5]);
        return { question: qStr, answer: formatFactors([f1, f2]) };
      } else if (type === 3) {
        // パターン3: a^2 - b^2 - ac + bc => p^2*v1^2 - qVar^2*v2^2 - p*r*v1*v3 + qVar*r*v2*v3 => (p v1 - qVar v2)(p v1 + qVar v2 - r v3)
        const p = getRandomInt(1, 3);
        const qVar = getRandomInt(1, 3);
        const r = getRandomNonZeroInt(-3, 3);
        const qStr = `${fmtTerm(p*p, v1+'^2', true)} ${fmtTerm(-qVar*qVar, v2+'^2')} ${fmtTerm(-p*r, v1+v3)} ${fmtTerm(qVar*r, v2+v3)}`;
        const f1 = stringifyPoly({ [v1]: p, [v2]: -qVar }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: p, [v2]: qVar, [v3]: -r }, [v1, v2, v3]);
        return { question: qStr, answer: formatFactors([f1, f2]) };
      } else if (type === 4) {
        // パターン4: x^2 + xz - y^2 + yz => p^2 v1^2 + p r v1 v3 - qVar^2 v2^2 + qVar r v2 v3 => (p v1 + qVar v2)(p v1 - qVar v2 + r v3)
        const p = getRandomInt(1, 3);
        const qVar = getRandomInt(1, 3);
        const r = getRandomNonZeroInt(-3, 3);
        const terms = [
          { c: p*p, v: v1+'^2' },
          { c: p*r, v: v1+v3 },
          { c: -qVar*qVar, v: v2+'^2' },
          { c: qVar*r, v: v2+v3 }
        ];
        let qStr = "";
        terms.forEach((t, i) => { qStr += (i > 0 ? " " : "") + fmtTerm(t.c, t.v, i === 0); });
        const f1 = stringifyPoly({ [v1]: p, [v2]: qVar }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: p, [v2]: -qVar, [v3]: r }, [v1, v2, v3]);
        return { question: qStr, answer: formatFactors([f1, f2]) };
      } else if (type === 5) {
        // パターン5: x - y(x-y+1) => v1 - m v1 v2 + k m v2^2 - k v2 => (v1 - k v2)(1 - m v2)
        const k = getRandomNonZeroInt(-3, 3);
        const m = getRandomNonZeroInt(-3, 3);
        const qStr = `${v1} ${fmtTerm(-m, v1+v2)} ${fmtTerm(m*k, v2+'^2')} ${fmtTerm(-k, v2)}`;
        const f1 = stringifyPoly({ [v1]: 1, [v2]: -k }, [v1, v2]);
        const f2 = stringifyPoly({ const: 1, [v2]: -m }, [v1, v2]);
        return { question: qStr, answer: formatFactors([f1, f2]) };
      } else if (type === 6) {
        // パターン6: a^3 - a^2b - ac^2 + bc^2 => v1^3 - p v1^2 v2 - qVar^2 v1 v3^2 + p qVar^2 v2 v3^2 => (v1 - p v2)(v1 - qVar v3)(v1 + qVar v3)
        const p = getRandomNonZeroInt(-3, 3);
        const qVar = getRandomInt(1, 3);
        const qStr = `${v1}^3 ${fmtTerm(-p, v1+'^2'+v2)} ${fmtTerm(-qVar*qVar, v1+v3+'^2')} ${fmtTerm(p*qVar*qVar, v2+v3+'^2')}`;
        const f1 = stringifyPoly({ [v1]: 1, [v2]: -p }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: 1, [v3]: -qVar }, [v1, v3]);
        const f3 = stringifyPoly({ [v1]: 1, [v3]: qVar }, [v1, v3]);
        return { question: qStr, answer: formatFactors([f1, f2, f3]) };
      } else {
        // パターン7: a^2 - ab - ac + a + bc - c => v1^2 - qVar v1 v2 + r v1 - p v1 v3 + p qVar v2 v3 - p r v3 => (v1 - p v3)(v1 - qVar v2 + r)
        const p = getRandomNonZeroInt(-3, 3);
        const qVar = getRandomNonZeroInt(-3, 3);
        const r = getRandomNonZeroInt(-3, 3);
        const qStr = `${v1}^2 ${fmtTerm(-qVar, v1+v2)} ${fmtTerm(r, v1)} ${fmtTerm(-p, v1+v3)} ${fmtTerm(p*qVar, v2+v3)} ${fmtTerm(-p*r, v3)}`;
        const f1 = stringifyPoly({ [v1]: 1, [v3]: -p }, [v1, v3]);
        const f2 = stringifyPoly({ [v1]: 1, [v2]: -qVar, const: r }, [v1, v2]);
        return { question: qStr, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル6: 高度な組み合わせ・多段因数分解
    level6: (forcedType) => {
      const g = getRandGroup();
      const v = g[0];
      const type = forcedType !== undefined ? forcedType : levelQueues.level6.next();
      
      if (type === 1) { // 組み換えによる平方の差
        const v2 = g[1], a = getRandomNonZeroInt(-4, 4);
        const terms = [{ c: 1, t: `${v}^2` }, { c: 2*a, t: v }, { c: a*a, t: "" }, { c: -1, t: `${v2}^2` }].sort(() => Math.random() - 0.5);
        let q = "";
        terms.forEach((item, i) => {
          q += (i > 0 ? " " : "") + (item.t === "" ? fmtConst(item.c, i === 0) : fmtTerm(item.c, item.t, i === 0));
        });
        const f1 = stringifyPoly({ [v]: 1, [v2]: 1, const: a }, [v, v2]);
        const f2 = stringifyPoly({ [v]: 1, [v2]: -1, const: a }, [v, v2]);
        return { question: q, answer: formatFactors([f1, f2]) };
      } else if (type === 2) { // 共通因数と置き換えの複合
        const v2 = g[1], v3 = g[2], k = getRandomNonZeroInt(2, 3), a = getRandomNonZeroInt(-2, 2);
        const q = `${k}${v3}${v[0]}^2 - ${2*k}${v3}${v[0]}${v2} + ${k}${v3}${v2}^2 ${fmtTerm(2*a*k, `(${v[0]}-${v2})${v3}^2`)} ${fmtTerm(k*a*a, v3+'^3')}`;
        const f = stringifyPoly({ [v[0]]: 1, [v2]: -1, [v3]: a }, [v[0], v2, v3]);
        return { question: q, answer: formatFactors([f, f], `${k}${v3}`) };
      } else if (type === 3) { // (x+a)(x+b)(x+c)(x+d)+k (a+b=c+d)
        let a, b, c, d, ab, cd, S, offset, resM, resN, k;
        while(true) {
          a = getRandomInt(-4, 4); b = getRandomInt(-4, 4); c = getRandomInt(-4, 4); d = a + b - c;
          if (new Set([a, b, c, d]).size >= 3 && Math.abs(d) <= 6) {
            ab = a * b; cd = c * d; S = a + b; offset = getRandomNonZeroInt(-3, 3); resM = ab + offset; resN = cd - offset; k = resM * resN - ab * cd;
            if (k !== 0) break;
          }
        }
        // 重複値を2乗表記、0値は括弧なしで表示するヘルパー
        const fmtLinearFactors = (vals) => {
          const counts = {};
          vals.forEach(val => { counts[val] = (counts[val] || 0) + 1; });
          return Object.entries(counts).map(([val, cnt]) => {
            const n = Number(val);
            const s = n === 0 ? v : `(${v}${fmtConst(n)})`;
            return cnt === 1 ? s : `${s}^${cnt}`;
          }).join('');
        };
        const q = `${fmtLinearFactors([a, b, c, d])}${fmtConst(k)}`;
        const f1 = stringifyPoly({ [`${v}^2`]: 1, [v]: S, const: resM }, [`${v}^2`, v]);
        const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: S, const: resN }, [`${v}^2`, v]);
        return { question: q, answer: formatFactors([f1, f2]) };
      } else if (type === 4) { // (x+a)(x+b)(x+c)(x+d)+kx^2 (ac=bd)
        const pairs = [[-1, 4, -2, 2], [-1, -4, -2, -2], [1, 4, 2, 2], [1, -4, -2, 2], [-2, 3, -1, 6]];
        let a, c, b, d, P, s1, s2, offset, resM, resN, k;
        while(true) {
          const p = pairs[getRandomInt(0, pairs.length - 1)];
          a=p[0]; c=p[1]; b=p[2]; d=p[3]; P=a*c; s1 = a + c; s2 = b + d; offset = getRandomNonZeroInt(-2, 2); resM = s1 + offset; resN = s2 - offset; k = resM * resN - s1 * s2;
          if (k !== 0) break;
        }
        const fmtLinearFactors4 = (vals) => {
          const counts = {};
          vals.forEach(val => { counts[val] = (counts[val] || 0) + 1; });
          return Object.entries(counts).map(([val, cnt]) => {
            const n = Number(val);
            const s = n === 0 ? v : `(${v}${fmtConst(n)})`;
            return cnt === 1 ? s : `${s}^${cnt}`;
          }).join('');
        };
        const q = `${fmtLinearFactors4([a, c, b, d])}${fmtTerm(k, v+'^2')}`;
        const f1 = stringifyPoly({ [`${v}^2`]: 1, [v]: resM, const: P }, [`${v}^2`, v]);
        const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: resN, const: P }, [`${v}^2`, v]);
        return { question: q, answer: formatFactors([f1, f2]) };

      } else if (type === 5) { // 多段置き換え
        const a = getRandomInt(-2, 2), p = getRandomInt(-3, 3), q = a - p, r = getRandomInt(-3, 3), s = a - r;
        if (p*q === r*s || (p+q) !== (r+s)) return problemGenerators.factorization.level6(type); 
        const m = p * q, n = r * s;
        const qStr = `(${v}^2${fmtTerm(a, v)})^2 ${fmtTerm(m + n, '('+v+'^2'+fmtTerm(a, v)+')')} ${fmtConst(m * n)}`;
        const factors = [p, q, r, s].map(c => stringifyPoly({ [v]: 1, const: c }, [v]));
        return { question: qStr, answer: formatFactors(factors) };
      } else { // 共通因数くくり出し後の多段分解
        const a = getRandomInt(-3, 3), b = getRandomInt(-3, 3);
        if (a === b || a === 0 || b === 0) return problemGenerators.factorization.level6(type);
        const c = getRandomNonZeroInt(-2, 2);
        const q = `${v}^2(${v}${fmtConst(c)})^2 ${fmtTerm(a + b - c, v+'^2('+v+fmtConst(c)+')')} ${fmtTerm(a * b, v+'('+v+fmtConst(c)+')')}`;
        const factors = [v, stringifyPoly({ [v]: 1, const: c }, [v]), stringifyPoly({ [v]: 1, const: a }, [v]), stringifyPoly({ [v]: 1, const: b }, [v])];
        return { question: q, answer: formatFactors(factors) };
      }
    },

    // レベル7: 複2次式
    level7: () => {
      const g = getRandGroup();
      const v = g[0], subType = levelQueues.level7.next();
      
      const getFactors = (vStr, c) => {
        if (c < 0 && Math.sqrt(-c) % 1 === 0) {
          const r = Math.sqrt(-c);
          return [stringifyPoly({ [vStr]: 1, const: r }, [vStr]), stringifyPoly({ [vStr]: 1, const: -r }, [vStr])];
        }
        return [stringifyPoly({ [`${vStr}^2`]: 1, const: c }, [`${vStr}^2`])];
      };

      if (subType === 1) {
        // 80%の確率で少なくとも1つを負の平方数にする
        const useNegSquare = Math.random() < 0.8;
        let a, b;
        if (useNegSquare) {
          const ra = getRandomInt(1, 4);
          a = -(ra * ra);
          // bはランダム（正負問わず）
          b = getRandomNonZeroInt(-9, 9);
          if (Math.random() < 0.4) {
            const rb = getRandomInt(1, 4);
            b = -(rb * rb);
          }
        } else {
          a = getRandomNonZeroInt(-9, 9);
          b = getRandomNonZeroInt(-9, 9);
        }
        const q = `${v}^4 ${fmtTerm(a + b, v+'^2')} ${fmtConst(a * b)}`;
        const factors = [...getFactors(v, a), ...getFactors(v, b)];
        return { question: q, answer: formatFactors(factors) };
      } else {
        // 約60%の確率でcを負の平方数に
        let a, c;
        const forceNegSquare = Math.random() < 0.6;
        let attempts = 0;
        while (true) {
          a = getRandomInt(1, 5);
          if (forceNegSquare) {
            const r = getRandomInt(1, 4);
            c = -(r * r);
          } else {
            c = getRandomNonZeroInt(-6, 6);
          }
          const disc = a * a - 4 * c;
          if (disc >= 0 && Math.sqrt(disc) % 1 === 0) { if (++attempts < 20) continue; }
          break;
        }
        const mid = 2 * c - a * a;
        const q = `${v}^4 ${fmtTerm(mid, v+'^2')} ${fmtConst(c * c)}`;
        const f1 = stringifyPoly({ [`${v}^2`]: 1, [v]: a, const: c }, [`${v}^2`, v]);
        const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: -a, const: c }, [`${v}^2`, v]);
        return { question: q, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル8: 3次の公式
    level8: () => {
      const g = getRandGroup();
      const v = g[0], v2 = g[1];
      const subType = levelQueues.level8.next(); 
      const isHomo = Math.random() < 0.5;

      let p = getRandomInt(1, 3);
      if (Math.random() < 0.6) p = 1; // 係数1になりやすくする
      let q = getRandomNonZeroInt(-4, 4);

      if (subType === 1 || subType === 2) {
        // (px + qy)^3
        const p3 = p * p * p;
        const p2q = 3 * p * p * q;
        const pq2 = 3 * p * q * q;
        const q3 = q * q * q;
        const qStr = isHomo ? 
          `${fmtTerm(p3, v+'^3', true)} ${fmtTerm(p2q, v+'^2'+v2)} ${fmtTerm(pq2, v+v2+'^2')} ${fmtTerm(q3, v2+'^3')}` :
          `${fmtTerm(p3, v+'^3', true)} ${fmtTerm(p2q, v+'^2')} ${fmtTerm(pq2, v)} ${fmtConst(q3)}`;
        const f = isHomo ? stringifyPoly({ [v]: p, [v2]: q }, [v, v2]) : stringifyPoly({ [v]: p, const: q }, [v]);
        return { question: qStr, answer: formatFactors([f, f, f]) };
      } else if (subType === 3 || subType === 4) {
        // (px)^3 + (qy)^3 = (px+qy)(p^2 x^2 - pq xy + q^2 y^2)
        const p3 = p * p * p;
        const q3 = q * q * q;
        const qStr = isHomo ? 
          `${fmtTerm(p3, v+'^3', true)} ${fmtTerm(q3, v2+'^3')}` :
          `${fmtTerm(p3, v+'^3', true)} ${fmtConst(q3)}`;
        const f1 = isHomo ? stringifyPoly({ [v]: p, [v2]: q }, [v, v2]) : stringifyPoly({ [v]: p, const: q }, [v]);
        const f2 = isHomo ? stringifyPoly({ [`${v}^2`]: p*p, [v+v2]: -p*q, [`${v2}^2`]: q*q }, [`${v}^2`, v+v2, `${v2}^2`]) :
                            stringifyPoly({ [`${v}^2`]: p*p, [v]: -p*q, const: q*q }, [`${v}^2`, v]);
        return { question: qStr, answer: formatFactors([f1, f2]) };
      } else if (subType === 5) {
        // 紛らわしいパターン1: x^2(px+qy) - r^2 y^2(px+qy) = (px+qy)(x+ry)(x-ry)
        p = 1; 
        let r = getRandomInt(1, 4);
        if (Math.abs(q) === r) q = (q > 0 ? r + 1 : -(r + 1)); 
        const t1 = p, t2 = q, t3 = -p * r * r, t4 = -q * r * r;
        const qStr = isHomo ? 
          `${fmtTerm(t1, v+'^3', true)} ${fmtTerm(t2, v+'^2'+v2)} ${fmtTerm(t3, v+v2+'^2')} ${fmtTerm(t4, v2+'^3')}` :
          `${fmtTerm(t1, v+'^3', true)} ${fmtTerm(t2, v+'^2')} ${fmtTerm(t3, v)} ${fmtConst(t4)}`;
        
        const f1 = isHomo ? stringifyPoly({ [v]: p, [v2]: q }, [v, v2]) : stringifyPoly({ [v]: p, const: q }, [v]);
        const f2 = isHomo ? stringifyPoly({ [v]: 1, [v2]: r }, [v, v2]) : stringifyPoly({ [v]: 1, const: r }, [v]);
        const f3 = isHomo ? stringifyPoly({ [v]: 1, [v2]: -r }, [v, v2]) : stringifyPoly({ [v]: 1, const: -r }, [v]);
        return { question: qStr, answer: formatFactors([f1, f2, f3]) };
      } else {
        // 紛らわしいパターン2: (px+qy)^2(px-qy)
        const t1 = p * p * p;
        const t2 = p * p * q;
        const t3 = -p * q * q;
        const t4 = -q * q * q;
        const qStr = isHomo ? 
          `${fmtTerm(t1, v+'^3', true)} ${fmtTerm(t2, v+'^2'+v2)} ${fmtTerm(t3, v+v2+'^2')} ${fmtTerm(t4, v2+'^3')}` :
          `${fmtTerm(t1, v+'^3', true)} ${fmtTerm(t2, v+'^2')} ${fmtTerm(t3, v)} ${fmtConst(t4)}`;
        
        const f1 = isHomo ? stringifyPoly({ [v]: p, [v2]: q }, [v, v2]) : stringifyPoly({ [v]: p, const: q }, [v]);
        const f2 = isHomo ? stringifyPoly({ [v]: p, [v2]: -q }, [v, v2]) : stringifyPoly({ [v]: p, const: -q }, [v]);
        return { question: qStr, answer: formatFactors([f1, f1, f2]) };
      }
    },

    // レベル9: 因数定理
    level9: () => {
      const g = getRandGroup();
      const v = g[0];
      const isDegree4 = Math.random() < 0.4;
      
      const getLinear = () => {
        let p = getRandomInt(1, 3);
        if (Math.random() < 0.6) p = 1;
        let r = getRandomNonZeroInt(-3, 3);
        return { p, r, str: stringifyPoly({ [v]: p, const: -r }, [v]) };
      };

      const getIrredQuad = () => {
        let A, B, C;
        while (true) {
          A = getRandomInt(1, 3);
          if (Math.random() < 0.7) A = 1;
          B = getRandomInt(-3, 3);
          C = getRandomNonZeroInt(-4, 4);
          const disc = B * B - 4 * A * C;
          if (disc >= 0 && Math.sqrt(disc) % 1 === 0) continue;
          break;
        }
        return { A, B, C, str: stringifyPoly({ [`${v}^2`]: A, [v]: B, const: C }, [`${v}^2`, v]) };
      };

      const L1 = getLinear();
      const Q = getIrredQuad();

      if (!isDegree4) {
        // 3次式: (p x - r)(A x^2 + B x + C)
        const c3 = L1.p * Q.A;
        const c2 = L1.p * Q.B - L1.r * Q.A;
        const c1 = L1.p * Q.C - L1.r * Q.B;
        const c0 = -L1.r * Q.C;
        // 全係数のGCDが1になることを保証（問題に共通因数が残らないよう）
        const coeffs3 = [c3, c2, c1, c0].filter(x => x !== 0).map(Math.abs);
        const g3 = coeffs3.reduce((a, b) => gcd(a, b), coeffs3[0] || 1);
        if (g3 > 1) return problemGenerators.factorization.level9();
        const q = `${fmtTerm(c3, v+'^3', true)} ${fmtTerm(c2, v+'^2')} ${fmtTerm(c1, v)} ${fmtConst(c0)}`;
        return { question: q, answer: formatFactors([L1.str, Q.str]) };
      } else {
        // 4次式: (p x - r)(q x - s)(A x^2 + B x + C)
        const L2 = getLinear();
        const E = L1.p * L2.p;
        const F = -L1.p * L2.r - L1.r * L2.p;
        const G = L1.r * L2.r;
        
        const c4 = E * Q.A;
        const c3 = E * Q.B + F * Q.A;
        const c2 = E * Q.C + F * Q.B + G * Q.A;
        const c1 = F * Q.C + G * Q.B;
        const c0 = G * Q.C;
        const coeffs4 = [c4, c3, c2, c1, c0].filter(x => x !== 0).map(Math.abs);
        const g4 = coeffs4.reduce((a, b) => gcd(a, b), coeffs4[0] || 1);
        if (g4 > 1) return problemGenerators.factorization.level9();
        const q = `${fmtTerm(c4, v+'^4', true)} ${fmtTerm(c3, v+'^3')} ${fmtTerm(c2, v+'^2')} ${fmtTerm(c1, v)} ${fmtConst(c0)}`;
        return { question: q, answer: formatFactors([L1.str, L2.str, Q.str]) };
      }
    },

    // レベル10: 2元2次6項 (ax+by+c)(dx+ey+f) ランダム係数
    level10: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1];

      const randCoeff = () => getRandomNonZeroInt(-5, 5);

      const tryGenerate = () => {
        const isMonic = Math.random() < 0.5;
        let a, d;
        if (isMonic) {
          a = 1; d = 1;
        } else {
          do { a = randCoeff(); d = randCoeff(); } while (Math.abs(a) === 1 && Math.abs(d) === 1);
        }
        
        // 残り4係数をランダムに生成。全体で±1が2個以上になるよう保証
        let b, c, e, f;
        let attempts = 0;
        while (true) {
          b = randCoeff(); c = randCoeff(); e = randCoeff(); f = randCoeff();
          const unitCount = [a, b, c, d, e, f].filter(x => Math.abs(x) === 1).length;
          if (unitCount >= 2) break;
          if (++attempts > 200) break;
        }
        return { a, b, c, d, e, f };
      };

      const { a, b, c, d, e, f } = tryGenerate();

      // 展開: (ax+by+c)(dx+ey+f)
      // = ad x^2 + (ae+bd) xy + be y^2 + (af+cd) x + (bf+ce) y + cf
      const coef_x2  = a * d;
      const coef_xy  = a * e + b * d;
      const coef_y2  = b * e;
      const coef_x   = a * f + c * d;
      const coef_y   = b * f + c * e;
      const coef_c   = c * f;

      const termStr = (coef, term, isFirst = false) =>
        coef === 0 ? '' : (term ? fmtTerm(coef, term, isFirst) : fmtConst(coef, isFirst));

      let q = '';
      const terms = [
        [coef_x2,  `${v1}^2`],
        [coef_xy,  v1 + v2],
        [coef_y2,  `${v2}^2`],
        [coef_x,   v1],
        [coef_y,   v2],
        [coef_c,   ''],
      ];
      let isFirst = true;
      for (const [coef, term] of terms) {
        if (coef === 0) continue;
        q += ' ' + termStr(coef, term || null, isFirst);
        isFirst = false;
      }
      q = q.trim();

      const f1 = stringifyPoly({ [v1]: a, [v2]: b, const: c }, [v1, v2]);
      const f2 = stringifyPoly({ [v1]: d, [v2]: e, const: f }, [v1, v2]);
      return { question: q, answer: formatFactors([f1, f2]) };
    },

    // レベル11: (ax)^3+(by)^3+(cz)^3-3abcxyz 型の恒等式
    level11: () => {
      const g = getRandGroup();
      const [x, y, z] = g;

      // 係数 a,b,c は {-2,-1,1,2} からランダム、ただし少なくとも1つは ±1 かつ少なくとも1つは1
      const pickCoeffs = () => {
        const pool = [-2, -1, 1, 2];
        let a, b, c;
        while (true) {
          a = pool[getRandomInt(0, 3)];
          b = pool[getRandomInt(0, 3)];
          c = pool[getRandomInt(0, 3)];
          const hasOne = [a, b, c].some(v => v === 1);
          if (hasOne) return [a, b, c];
        }
      };

      const type = getRandomInt(1, 4);
      const [a, b, c] = pickCoeffs();

      if (type === 1) {
        // 基本パターン: (ax)^3 + (by)^3 + (cz)^3 - 3abcxyz
        // = (ax + by + cz)(a^2x^2 + b^2y^2 + c^2z^2 - abxy - bcyz - acxz)
        const t1 = a*a*a, t2 = b*b*b, t3 = c*c*c, t4 = -3*a*b*c;
        const q = `${fmtTerm(t1, x+'^3', true)} ${fmtTerm(t2, y+'^3')} ${fmtTerm(t3, z+'^3')} ${fmtTerm(t4, x+y+z)}`;
        const lin = stringifyPoly({ [x]: a, [y]: b, [z]: c }, [x, y, z]);
        const quad = stringifyPoly({ [`${x}^2`]: a*a, [`${y}^2`]: b*b, [`${z}^2`]: c*c, [x+y]: -a*b, [y+z]: -b*c, [x+z]: -a*c }, [`${x}^2`, `${y}^2`, `${z}^2`, x+y, y+z, x+z]);
        return { question: q, answer: formatFactors([lin, quad]) };

      } else if (type === 2) {
        // x^3+y^3+3axy-a^3 = (x+y-a)((x-y)^2+a(x+y)+a^2) パターン
        const aVal = a;
        const t3xy = 3 * aVal;
        const tConst = -aVal * aVal * aVal;
        const q = `${x}^3 ${fmtTerm(1, y+'^3')} ${fmtTerm(t3xy, x+y)} ${fmtConst(tConst)}`;
        const lin3 = stringifyPoly({ [x]: 1, [y]: 1, const: -aVal }, [x, y]);
        const quad3 = stringifyPoly({ [`${x}^2`]: 1, [x+y]: -2, [`${y}^2`]: 1, [x]: aVal, [y]: aVal, const: aVal*aVal }, [`${x}^2`, x+y, `${y}^2`, x, y]);
        return { question: q, answer: formatFactors([lin3, quad3]) };

      } else if (type === 3) {
        // (ax-by)^3+(by-cz)^3+(cz-ax)^3 = 3(ax-by)(by-cz)(cz-ax) パターン
        // a,b,cのうち2つが±2のとき、各項の2を8として外に出す
        const abs2count = [a, b, c].filter(v => Math.abs(v) === 2).length;
        const factor8 = abs2count >= 2; // 2つ以上が絶対値2なら各3乗項が8倍

        if (factor8) {
          // 各(ax-by)が2(±x∓y)なので各3乗が8倍 → 共通因数8を外に出す
          const sa = a > 0 ? 1 : -1, sb = b > 0 ? 1 : -1, sc = c > 0 ? 1 : -1;
          const na = Math.abs(a) === 2 ? sa : a;
          const nb = Math.abs(b) === 2 ? sb : b;
          const nc = Math.abs(c) === 2 ? sc : c;
          const innerA = `${fmtTerm(na, x, true)}${fmtTerm(-nb, y)}`;
          const innerB = `${fmtTerm(nb, y, true)}${fmtTerm(-nc, z)}`;
          const innerC = `${fmtTerm(nc, z, true)}${fmtTerm(-na, x)}`;
          const qFull = `8(${innerA})^3 + 8(${innerB})^3 + 8(${innerC})^3`;
          const f1 = stringifyPoly({ [x]: na, [y]: -nb }, [x, y]);
          const f2 = stringifyPoly({ [y]: nb, [z]: -nc }, [y, z]);
          const f3 = stringifyPoly({ [z]: nc, [x]: -na }, [z, x]);
          return { question: qFull, answer: formatFactors([f1, f2, f3], '24') };
        } else {
          const A2 = `${fmtTerm(a, x, true)}${fmtTerm(-b, y)}`;
          const B2 = `${fmtTerm(b, y, true)}${fmtTerm(-c, z)}`;
          const C2 = `${fmtTerm(c, z, true)}${fmtTerm(-a, x)}`;
          const q = `(${A2})^3 + (${B2})^3 + (${C2})^3`;
          const f1 = stringifyPoly({ [x]: a, [y]: -b }, [x, y]);
          const f2 = stringifyPoly({ [y]: b, [z]: -c }, [y, z]);
          const f3 = stringifyPoly({ [z]: c, [x]: -a }, [z, x]);
          return { question: q, answer: formatFactors([f1, f2, f3], '3') };
        }

      } else {
        // (ax)^3+(by)^3+(cz)^3-3abcxyz の係数違いで、1変数に係数をかけたパターン
        // patterned: one factor is negative → sign flip
        const at = a, bt = -b, ct = c;
        const t1b = at*at*at, t2b = bt*bt*bt, t3b = ct*ct*ct, t4b = -3*at*bt*ct;
        const q = `${fmtTerm(t1b, x+'^3', true)} ${fmtTerm(t2b, y+'^3')} ${fmtTerm(t3b, z+'^3')} ${fmtTerm(t4b, x+y+z)}`;
        const linB = stringifyPoly({ [x]: at, [y]: bt, [z]: ct }, [x, y, z]);
        const quadB = stringifyPoly({ [`${x}^2`]: at*at, [`${y}^2`]: bt*bt, [`${z}^2`]: ct*ct, [x+y]: -at*bt, [y+z]: -bt*ct, [x+z]: -at*ct }, [`${x}^2`, `${y}^2`, `${z}^2`, x+y, y+z, x+z]);
        return { question: q, answer: formatFactors([linB, quadB]) };
      }
    },

    // レベル12: 3変数高度対称式・交代式 (7パターン)
    level12: () => {
      const g = getRandGroup();
      const [x, y, z] = g;

      // 係数生成: 少なくとも1つは1、±2は最大1つ
      const pickCoeffs3 = () => {
        while (true) {
          const pool12 = [-1, 1];
          const pool2 = [-2, -1, 1, 2];
          // まず全部を±1から
          let a = pool12[getRandomInt(0, 1)];
          let b = pool12[getRandomInt(0, 1)];
          let c = pool12[getRandomInt(0, 1)];
          // 30%で1つだけ±2に置換
          if (Math.random() < 0.3) {
            const idx = getRandomInt(0, 2);
            const sign = Math.random() < 0.5 ? 2 : -2;
            if (idx === 0) a = sign;
            else if (idx === 1) b = sign;
            else c = sign;
          }
          // 少なくとも1つが1
          if ([a, b, c].some(v => v === 1)) return [a, b, c];
        }
      };

      const type = getRandomInt(1, 7);

      if (type === 1) {
        // (ax+1)(by+1)(cz+1) = abc·xyz + ab·xy + ac·xz + bc·yz + a·x + b·y + c·z + 1
        const [a, b, c] = pickCoeffs3();
        const coefXyz = a * b * c, coefXy = a * b, coefXz = a * c, coefYz = b * c;
        // 問題文の展開
        const terms = [
          [coefXyz, x+y+z], [coefXy, x+y], [coefXz, x+z], [coefYz, y+z],
          [a, x], [b, y], [c, z]
        ];
        let q = '';
        let first = true;
        for (const [coef, term] of terms) {
          if (coef === 0) continue;
          q += ' ' + fmtTerm(coef, term, first);
          first = false;
        }
        q += fmtConst(1, false);
        const f1 = stringifyPoly({ [x]: a, const: 1 }, [x]);
        const f2 = stringifyPoly({ [y]: b, const: 1 }, [y]);
        const f3 = stringifyPoly({ [z]: c, const: 1 }, [z]);
        return { question: q.trim(), answer: formatFactors([f1, f2, f3]) };

      } else if (type === 2) {
        // a^2(b-c)+b^2(c-a)+c^2(a-b) = -(a-b)(b-c)(c-a) [旧level12]
        const q = `${x}^2(${y}-${z}) + ${y}^2(${z}-${x}) + ${z}^2(${x}-${y})`;
        const f1 = stringifyPoly({ [x]: 1, [y]: -1 }, [x, y]);
        const f2 = stringifyPoly({ [y]: 1, [z]: -1 }, [y, z]);
        const f3 = stringifyPoly({ [z]: 1, [x]: -1 }, [z, x]);
        return { question: q, answer: formatFactors([f1, f2, f3], "-") };

      } else if (type === 3) {
        // (x+y+z)(xy+yz+zx) - xyz = (x+y)(y+z)(z+x)
        // 係数: (ax+by)(by+cz)(cz+ax) 形で展開
        const [a, b, c] = pickCoeffs3();
        // (ax+by+cz)(abxy+bcyz+acxz) - abcxyz を展開
        // 答えは (ax+by)(by+cz)(cz+ax)
        // 問題文は展開形: LHS = answered by showing (ax+by+cz)(abxy+bcyz+acxz)-abcxyz
        // 実際に展開: 
        //  (ax+by)(by+cz)(cz+ax)
        //  = (ab y^2 + acz y + b^2 xy + bcxz)(??? 複雑なので直接展開)
        // 直接展開 (ax+by)(by+cz)(cz+ax):
        const ab = a*b, bc = b*c, ca = c*a, abc = a*b*c;
        // 展開結果: ab·by·? ... 
        // (ax+by)(by+cz) = ab*xy + ac*xz + b^2*y^2 + bc*yz
        // × (cz+ax):
        // = abc*xyz + a^2b*x^2y + a^2c*x^2z + a^2b* - 複雑すぎる
        // パターン3のシンプル版: 係数を使わず x,y,z で出題
        const qStr = `(${x}+${y}+${z})(${x}${y}+${y}${z}+${z}${x})-${x}${y}${z}`;
        const g1 = stringifyPoly({ [x]: 1, [y]: 1 }, [x, y]);
        const g2 = stringifyPoly({ [y]: 1, [z]: 1 }, [y, z]);
        const g3 = stringifyPoly({ [z]: 1, [x]: 1 }, [z, x]);
        return { question: qStr, answer: formatFactors([g1, g2, g3]) };

      } else if (type === 4) {
        // (x+y)(y+z)(z+x)+xyz = (x+y+z)(xy+yz+zx)
        const qStr = `(${x}+${y})(${y}+${z})(${z}+${x})+${x}${y}${z}`;
        const s12 = stringifyPoly({ [x]: 1, [y]: 1, [z]: 1 }, [x, y, z]);
        // 答えの2次式 xy+yz+zx は stringifyPoly では整形難しいのでリテラル表記
        const s22 = `${x}${y}+${y}${z}+${z}${x}`;
        return { question: qStr, answer: `(${s12})(${s22})` };

      } else if (type === 5) {
        // x^4+y^4+z^4-2x^2y^2-2y^2z^2-2z^2x^2
        // = (x+y+z)(x+y-z)(x-y+z)(-x+y+z)
        const qStr = `${x}^4+${y}^4+${z}^4-2${x}^2${y}^2-2${y}^2${z}^2-2${z}^2${x}^2`;
        const e1 = stringifyPoly({ [x]: 1, [y]: 1, [z]: 1 }, [x, y, z]);
        const e2 = stringifyPoly({ [x]: 1, [y]: 1, [z]: -1 }, [x, y, z]);
        const e3 = stringifyPoly({ [x]: 1, [y]: -1, [z]: 1 }, [x, y, z]);
        const e4 = stringifyPoly({ [x]: -1, [y]: 1, [z]: 1 }, [x, y, z]);
        return { question: qStr, answer: formatFactors([e1, e2, e3, e4]) };

      } else if (type === 6) {
        // (ax+by+cz)^3-(ax)^3-(by)^3-(cz)^3 = 3(ax+by)(by+cz)(cz+ax)
        const [a, b, c] = pickCoeffs3();
        
        // (ax+by+cz) の部分: stringifyPoly を使うことで符号を適切に処理
        const innerSum = stringifyPoly({ [x]: a, [y]: b, [z]: c }, [x, y, z]);
        
        // (ax)^3 等の部分: 係数の絶対値が 1 の場合は括弧を外す
        const fmtCubicTerm = (coeff, variable) => {
          if (coeff === 1) return `${variable}^3`;
          if (coeff === -1) return `(-${variable})^3`;
          return `(${fmtTerm(coeff, variable, true)})^3`;
        };

        const qStr = `(${innerSum})^3-${fmtCubicTerm(a, x)}-${fmtCubicTerm(b, y)}-${fmtCubicTerm(c, z)}`;
        const h1 = stringifyPoly({ [x]: a, [y]: b }, [x, y]);
        const h2 = stringifyPoly({ [y]: b, [z]: c }, [y, z]);
        const h3 = stringifyPoly({ [z]: c, [x]: a }, [z, x]);
        return { question: qStr, answer: formatFactors([h1, h2, h3], '3') };

      } else {
        // x^3(y-z)+y^3(z-x)+z^3(x-y) = -(x-y)(y-z)(z-x)(x+y+z)
        // 一般化: (ax)^3(by-cz)+(by)^3(cz-ax)+(cz)^3(ax-by)
        const [a, b, c] = pickCoeffs3();
        const ax3 = fmtTerm(a*a*a, x+'^3', true);
        const by3_f = fmtTerm(b, y, true);
        const cz_f = fmtTerm(c, z, true);
        const by3 = fmtTerm(b*b*b, y+'^3', true);
        const ax_f = fmtTerm(a, x, true);
        const cz3 = fmtTerm(c*c*c, z+'^3', true);
        const qStr = `${ax3}(${by3_f}-${cz_f})+${by3}(${cz_f}-${ax_f})+${cz3}(${ax_f}-${by3_f})`;
        const i1 = stringifyPoly({ [x]: a, [y]: -b }, [x, y]);
        const i2 = stringifyPoly({ [y]: b, [z]: -c }, [y, z]);
        const i3 = stringifyPoly({ [z]: c, [x]: -a }, [z, x]);
        const i4 = stringifyPoly({ [x]: a, [y]: b, [z]: c }, [x, y, z]);
        return { question: qStr, answer: formatFactors([i1, i2, i3, i4], '-') };
      }
    }
  }
};

export const generateProblem = (category, level) => {
  const levelKey = `level${level}`;
  if (problemGenerators[category] && problemGenerators[category][levelKey]) {
    const prob = problemGenerators[category][levelKey]();
    return {
      type: '因数分解せよ',
      category,
      level,
      ...prob
    };
  }
  return null;
};
