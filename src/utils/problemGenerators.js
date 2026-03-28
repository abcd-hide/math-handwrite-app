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
  ['m', 'n', 'k']
];

const getRandGroup = () => variableGroups[getRandomInt(0, variableGroups.length - 1)];

export const problemGenerators = {
  factorization: {
    // レベル1: 中学くくりだし
    level1: () => {
      const g = getRandGroup();
      const v = [...g];
      const numTerms = Math.random() > 0.4 ? 3 : 2;
      const commonType = getRandomInt(1, 3);
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
      const isHomogeneous = Math.random() < 0.4;
      const subType = getRandomInt(1, 3);
      
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
      const isHomogeneous = Math.random() < 0.4;
      let a, b, c, d;
      while(true) {
        a = getRandomNonZeroInt(-3, 3); b = getRandomNonZeroInt(-5, 5);
        c = getRandomNonZeroInt(-3, 3); d = getRandomNonZeroInt(-5, 5);
        if (a*c !== 0 && (a !== c || b !== d)) break;
      }
      const q = isHomogeneous ? `${fmtTerm(a * c, v + '^2')} ${fmtTerm(a * d + b * c, v + v2)} ${fmtTerm(b * d, v2 + '^2')}`
                              : `${fmtTerm(a * c, v + '^2')} ${fmtTerm(a * d + b * c, v)} ${fmtConst(b * d)}`;
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
      const baseLevel = getRandomInt(1, 3);

      if (baseLevel === 1) { // leading(X+a)(X+b)
        const k = getRandomNonZeroInt(-3, 3);
        const a = getRandomNonZeroInt(-4, 4);
        const b = getRandomNonZeroInt(-4, 4);
        const q = `${fmtTerm(k, `(${X.str})^2`)}${fmtTerm(k*(a+b), `(${X.str})`)}${fmtConst(k*a*b)}`;
        const f1 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: a }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: X.a, [v2]: X.b, const: b }, [v1, v2]);
        return { question: q, answer: formatFactors([f1, f2], k === 1 ? "" : (k === -1 ? "-" : k)) };
      } else if (baseLevel === 2) { // (X+a)(X+b) etc
        const subType = getRandomInt(1, 3);
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
        const q = `${fmtTerm(a*c, `(${X.str})^2`)}${fmtTerm(a*d+b*c, `(${X.str})`)}${fmtConst(b*d)}`;
        const f1 = stringifyPoly({ [v1]: a*X.a, [v2]: a*X.b, const: b }, [v1, v2]);
        const f2 = stringifyPoly({ [v1]: c*X.a, [v2]: c*X.b, const: d }, [v1, v2]);
        return { question: q, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル5: 最低次数について整理
    level5: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1], v3 = g[2];
      const type = getRandomInt(0, 7);

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
    level6: () => {
      const g = getRandGroup();
      const v = g[0];
      const type = getRandomInt(1, 6);
      
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
        let a, b, c, d; while(true) { a = getRandomInt(-4, 4); b = getRandomInt(-4, 4); c = getRandomInt(-4, 4); d = a + b - c; if (new Set([a, b, c, d]).size >= 3 && Math.abs(d) <= 6) break; }
        const ab = a * b, cd = c * d, S = a + b, offset = getRandomNonZeroInt(-3, 3), resM = ab + offset, resN = cd - offset, k = resM * resN - ab * cd;
        const q = `(${v}${fmtConst(a)})(${v}${fmtConst(b)})(${v}${fmtConst(c)})(${v}${fmtConst(d)})${fmtConst(k)}`;
        const f1 = stringifyPoly({ [`${v}^2`]: 1, [v]: S, const: resM }, [`${v}^2`, v]);
        const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: S, const: resN }, [`${v}^2`, v]);
        return { question: q, answer: formatFactors([f1, f2]) };
      } else if (type === 4) { // (x+a)(x+b)(x+c)(x+d)+kx^2 (ac=bd)
        const pairs = [[-1, 4, -2, 2], [-1, -4, -2, -2], [1, 4, 2, 2], [1, -4, -2, 2], [-2, 3, -1, 6]];
        const p = pairs[getRandomInt(0, pairs.length - 1)], a=p[0], c=p[1], b=p[2], d=p[3], P=a*c, s1 = a + c, s2 = b + d, offset = getRandomNonZeroInt(-2, 2), resM = s1 + offset, resN = s2 - offset, k = resM * resN - s1 * s2;
        const q = `(${v}${fmtConst(a)})(${v}${fmtConst(c)})(${v}${fmtConst(b)})(${v}${fmtConst(d)})${fmtTerm(k, v+'^2')}`;
        const f1 = stringifyPoly({ [`${v}^2`]: 1, [v]: resM, const: P }, [`${v}^2`, v]);
        const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: resN, const: P }, [`${v}^2`, v]);
        return { question: q, answer: formatFactors([f1, f2]) };
      } else if (type === 5) { // 多段置き換え
        const a = getRandomInt(-2, 2), p = getRandomInt(-3, 3), q = a - p, r = getRandomInt(-3, 3), s = a - r;
        if (p*q === r*s || (p+q) !== (r+s)) return problemGenerators.factorization.level6(); 
        const m = p * q, n = r * s;
        const qStr = `(${v}^2${fmtTerm(a, v)})^2 ${fmtTerm(m + n, '('+v+'^2'+fmtTerm(a, v)+')')} ${fmtConst(m * n)}`;
        const factors = [p, q, r, s].map(c => stringifyPoly({ [v]: 1, const: c }, [v]));
        return { question: qStr, answer: formatFactors(factors) };
      } else { // 共通因数くくり出し後の多段分解
        const a = getRandomInt(-3, 3), b = getRandomInt(-3, 3);
        if (a === b || a === 0 || b === 0) return problemGenerators.factorization.level6();
        const c = getRandomNonZeroInt(-2, 2);
        const q = `${v}^2(${v}${fmtConst(c)})^2 ${fmtTerm(a + b - c, v+'^2('+v+fmtConst(c)+')')} ${fmtTerm(a * b, v+'('+v+fmtConst(c)+')')}`;
        const factors = [v, stringifyPoly({ [v]: 1, const: c }, [v]), stringifyPoly({ [v]: 1, const: a }, [v]), stringifyPoly({ [v]: 1, const: b }, [v])];
        return { question: q, answer: formatFactors(factors) };
      }
    },

    // レベル7: 複2次式
    level7: () => {
      const g = getRandGroup();
      const v = g[0], subType = Math.random() > 0.5 ? 1 : 2;
      if (subType === 1) {
        const a = getRandomInt(1, 4), b = getRandomInt(5, 9);
        const q = `${v}^4 ${fmtTerm(a + b, v+'^2')} ${fmtConst(a * b)}`;
        const f1 = `${v}^2+${a}`, f2 = `${v}^2+${b}`;
        return { question: q, answer: formatFactors([f1, f2]) };
      } else {
        const q = `${v}^4 + ${v}^2 + 1`;
        const f1 = `${v}^2+${v}+1`, f2 = `${v}^2-${v}+1`;
        return { question: q, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル8: 3次の公式
    level8: () => {
      const g = getRandGroup();
      const v = g[0], subType = Math.random() > 0.5 ? 1 : 2, a = getRandomNonZeroInt(-3, 3);
      if (subType === 1) { // (x+a)^3
        const q = `${v}^3${fmtTerm(3 * a, v+'^2')}${fmtTerm(3 * a * a, v)}${fmtConst(a * a * a)}`;
        const f = stringifyPoly({ [v]: 1, const: a }, [v]);
        return { question: q, answer: `(${f})^3` };
      } else { // x^3 + a^3 = (x+a)(x^2-ax+a^2)
        const q = `${v}^3${fmtConst(a * a * a)}`;
        const f1 = stringifyPoly({ [v]: 1, const: a }, [v]);
        const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: -a, const: a * a }, [`${v}^2`, v]);
        return { question: q, answer: formatFactors([f1, f2]) };
      }
    },

    // レベル9: 因数定理
    level9: () => {
      const g = getRandGroup();
      const v = g[0], r = getRandomNonZeroInt(-3, 3), b = getRandomInt(-3, 3), c = getRandomNonZeroInt(-4, 4);
      const q = `${v}^3${fmtTerm(b - r, v+'^2')}${fmtTerm(c - r * b, v)}${fmtConst(-r * c)}`;
      const f1 = stringifyPoly({ [v]: 1, const: -r }, [v]);
      const f2 = stringifyPoly({ [`${v}^2`]: 1, [v]: b, const: c }, [`${v}^2`, v]);
      return { question: q, answer: formatFactors([f1, f2]) };
    },

    // レベル10: 2元2次6項
    level10: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1];
      const q = `${v1}^2 + 3${v1}${v2} + 2${v2}^2 + 2${v1} + 3${v2} + 1`;
      const f1 = stringifyPoly({ [v1]: 1, [v2]: 1, const: 1 }, [v1, v2]);
      const f2 = stringifyPoly({ [v1]: 1, [v2]: 2, const: 1 }, [v1, v2]);
      return { question: q, answer: formatFactors([f1, f2]) };
    },

    // レベル11: 3変数対称式・交代式
    level11: () => {
      const g = getRandGroup();
      const a = g[0], b = g[1], c = g[2];
      const q = `${a}^2(${b}-${c}) + ${b}^2(${c}-${a}) + ${c}^2(${a}-${b})`;
      const f1 = stringifyPoly({ [a]: 1, [b]: -1 }, [a, b]);
      const f2 = stringifyPoly({ [b]: 1, [c]: -1 }, [b, c]);
      const f3 = stringifyPoly({ [c]: 1, [a]: -1 }, [c, a]);
      return { question: q, answer: formatFactors([f1, f2, f3], "-") };
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
