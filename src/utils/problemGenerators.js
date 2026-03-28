/**
 * 因数分解の問題生成ロジック
 */

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomNonZeroInt = (min, max) => {
  let res = 0;
  while (res === 0) res = getRandomInt(min, max);
  return res;
};

// 定数項の処理
const fmtConst = (n, first = false) => {
  if (n === 0) return "";
  if (n > 0) return first ? `${n}` : `+${n}`;
  return `${n}`;
};

// 係数の処理 (1, -1 の場合に数字を省略する)
const fmtCoeff = (n, first = false) => {
  if (n === 1) return first ? "" : "+";
  if (n === -1) return "-";
  if (n > 0) return first ? `${n}` : `+${n}`;
  return `${n}`;
};

const fmtTerm = (coeff, term, first = false) => {
  if (coeff === 0) return "";
  return `${fmtCoeff(coeff, first)}${term}`;
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
    // レベル1: 中学くくりだし (2項/3項混合、符号混合、係数多様化対応)
    level1: () => {
      const g = getRandGroup();
      const v = [...g]; // x, y, z
      const numTerms = Math.random() > 0.4 ? 3 : 2;
      const commonType = getRandomInt(1, 3); // 1: const, 2: var, 3: mixed
      
      let cfNum = 1;
      let cfVar = "";
      
      if (commonType === 1 || commonType === 3) {
        cfNum = getRandomNonZeroInt(-6, 6);
        if (cfNum === 1 || cfNum === -1) cfNum = (cfNum > 0 ? 2 : -2);
      }
      if (commonType === 2 || commonType === 3) {
        cfVar = v[0];
      }

      const terms = [];
      for (let i = 0; i < numTerms; i++) {
        let c = getRandomNonZeroInt(-4, 4);
        if (i === 0) c = Math.abs(c); // First term positive inside for neatness
        
        // Pick a variable or constant
        let tVar = v[i];
        if (i === 0 && commonType === 2) tVar = v[0]; // will be v0^2
        
        terms.push({ c, v: tVar });
      }

      let q = "";
      let inner = "";
      terms.forEach((t, i) => {
        const finalC = cfNum * t.c;
        const finalV = (cfVar && t.v === cfVar) ? `${cfVar}^2` : `${cfVar}${t.v}`;
        q += fmtTerm(finalC, finalV, i === 0);
        inner += fmtTerm(t.c, t.v, i === 0);
      });

      const leading = (cfNum === 1 && cfVar) ? cfVar : 
                    (cfNum === -1 && cfVar) ? `-${cfVar}` :
                    (cfNum === 1 && !cfVar) ? "1" :
                    (cfNum === -1 && !cfVar) ? "-1" :
                    `${cfNum}${cfVar}`;
      
      const ans = `${leading}(${inner})`;
      return { question: q, answer: ans };
    },

    // レベル2: 中学公式 (x+a)(x+b), (x+a)^2, (x+a)(x-a)
    level2: () => {
      const g = getRandGroup();
      const v1 = g[0];
      const v2 = g[1];
      const isHomogeneous = Math.random() < 0.4;
      const subType = getRandomInt(1, 3);
      
      if (subType === 1) { // (x+a)(x+b) or (x+ay)(x+by)
        const a = getRandomNonZeroInt(-6, 6);
        let b = getRandomNonZeroInt(-6, 6);
        if (a === b) b += 1;
        
        let q, ans;
        if (isHomogeneous) {
          // x^2 + (a+b)xy + aby^2
          q = `${v1}^2${fmtTerm(a + b, v1 + v2)}${fmtTerm(a * b, v2 + '^2')}`;
          ans = `(${v1}${fmtTerm(a, v2)})(${v1}${fmtTerm(b, v2)})`;
        } else {
          q = `${v1}^2${fmtTerm(a + b, v1)}${fmtConst(a * b)}`;
          ans = `(${v1}${fmtConst(a)})(${v1}${fmtConst(b)})`;
        }
        return { question: q, answer: ans };
      } else if (subType === 2) { // (x+a)^2 or (x+ay)^2
        const a = getRandomNonZeroInt(-6, 6);
        let q, ans;
        if (isHomogeneous) {
          // x^2 + 2axy + a^2y^2
          q = `${v1}^2${fmtTerm(2 * a, v1 + v2)}${fmtTerm(a * a, v2 + '^2')}`;
          ans = `(${v1}${fmtTerm(a, v2)})^2`;
        } else {
          q = `${v1}^2${fmtTerm(2 * a, v1)}${fmtConst(a * a)}`;
          ans = `(${v1}${fmtConst(a)})^2`;
        }
        return { question: q, answer: ans };
      } else { // (x+a)(x-a) or (x+ay)(x-ay)
        const a = getRandomInt(1, 10);
        let q, ans;
        if (isHomogeneous) {
          // x^2 - a^2y^2
          q = `${v1}^2${fmtTerm(-a * a, v2 + '^2')}`;
          const aTerm = a === 1 ? "" : a;
          ans = `(${v1}-${aTerm}${v2})(${v1}+${aTerm}${v2})`;
        } else {
          q = `${v1}^2-${a * a}`;
          ans = `(${v1}-${a})(${v1}+${a})`;
        }
        return { question: q, answer: ans };
      }
    },

    // レベル3: たすきがけ
    level3: () => {
      const g = getRandGroup();
      const v1 = g[0];
      const v2 = g[1];
      const isHomogeneous = Math.random() < 0.4;
      
      const a = getRandomNonZeroInt(-4, 4);
      const c = getRandomNonZeroInt(-4, 4);
      const b = getRandomNonZeroInt(-6, 6);
      const d = getRandomNonZeroInt(-6, 6);
      
      // (ax+b)(cx+d) = ac x^2 + (ad+bc)x + bd
      // (ax+by)(cx+dy) = ac x^2 + (ad+bc)xy + bd y^2
      const coeff2 = a * c;
      const coeff1 = a * d + b * c;
      const coeff0 = b * d;
      
      let q, ans;
      if (isHomogeneous) {
        q = `${fmtTerm(coeff2, v1+'^2', true)}${fmtTerm(coeff1, v1+v2)}${fmtTerm(coeff0, v2+'^2')}`;
        ans = `(${fmtTerm(a, v1, true)}${fmtTerm(b, v2)})(${fmtTerm(c, v1, true)}${fmtTerm(d, v2)})`;
      } else {
        q = `${fmtTerm(coeff2, v1+'^2', true)}${fmtTerm(coeff1, v1)}${fmtConst(coeff0)}`;
        ans = `(${fmtTerm(a, v1, true)}${fmtConst(b)})(${fmtTerm(c, v1, true)}${fmtConst(d)})`;
      }
      return { question: q, answer: ans };
    },

    // レベル4: 文字の置き換え
    level4: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1], v3 = g[2];
      
      const baseLevel = getRandomInt(1, 3);
      const isBaseHomogeneous = Math.random() < 0.4;
      
      const gcd = (a, b) => {
        a = Math.abs(a); b = Math.abs(b);
        while (b) { a %= b; [a, b] = [b, a]; }
        return a;
      };
      const gcd3 = (a, b, c) => gcd(a, gcd(b, c));

      const makeTerm = (vars, useConst = true) => {
        let a, b, c;
        while (true) {
          a = getRandomNonZeroInt(-2, 2);
          b = Math.random() > 0.4 ? getRandomNonZeroInt(-2, 2) : 0;
          c = useConst && Math.random() > 0.5 ? getRandomNonZeroInt(-3, 3) : 0;
          const count = (a !== 0 ? 1 : 0) + (b !== 0 ? 1 : 0) + (c !== 0 ? 1 : 0);
          if (count < 2) continue; // 単項式を排除
          if (gcd3(a, b, c) !== 1) continue; // 定数がくくれるものを排除
          break;
        }
        return { a, b, c, v1: vars[0], v2: vars[1] };
      };

      const fmtRepl = (t) => {
        let res = fmtTerm(t.a, t.v1, true);
        if (t.b !== 0) res += fmtTerm(t.b, t.v2);
        if (t.c !== 0) res += fmtConst(t.c);
        return `(${res})`;
      };

      const simplify = (cX, tX, cY, tY, k) => {
        const coeffs = {};
        const add = (c, t) => {
          if (!t) return;
          if (t.v1) coeffs[t.v1] = (coeffs[t.v1] || 0) + c * t.a;
          if (t.v2) coeffs[t.v2] = (coeffs[t.v2] || 0) + c * t.b;
        };
        add(cX, tX);
        if (cY) add(cY, tY);
        
        const constPart = cX * tX.c + (cY ? cY * tY.c : 0) + k;
        
        let res = "";
        let first = true;
        // 使用している変数をソートして順序を固定
        const vars = Array.from(new Set([tX.v1, tX.v2, tY ? tY.v1 : null, tY ? tY.v2 : null])).filter(v => v);
        vars.sort();
        
        vars.forEach(v => {
          if (coeffs[v]) {
            res += fmtTerm(coeffs[v], v, first);
            first = false;
          }
        });
        if (constPart !== 0 || res === "") {
          res += fmtConst(constPart, first);
        }
        return res;
      };

      let termX = makeTerm([v1, v2]);
      let X = fmtRepl(termX);
      
      let termY, Y;
      if (isBaseHomogeneous) {
        const hType = getRandomInt(1, 4); // 1:Only X replaced, 2:Only Y replaced, 3:Both, 4:Both with overlap
        if (hType === 1) { // V1=X, V2=v3
          termY = { a: 1, b: 0, c: 0, v1: v3, v2: null };
          Y = v3;
        } else if (hType === 2) { // V1=v3, V2=Y
          termY = makeTerm([v1, v2]);
          const tempX = termX; termX = { a: 1, b: 0, c: 0, v1: v3, v2: null };
          termY = tempX;
          X = v3; Y = fmtRepl(termY);
        } else if (hType === 3) { // V1=X, V2=Y (separate vars)
          termY = makeTerm([v3, g[3] || 'w']); 
          Y = fmtRepl(termY);
        } else { // V1=X, V2=Y (overlapping vars)
          termY = makeTerm([v2, v3]);
          Y = fmtRepl(termY);
        }
      }

      if (baseLevel === 1) { // kX^2 + kAX or kX^2 + kXY
        const k = getRandomNonZeroInt(-3, 3);
        if (!isBaseHomogeneous) {
          const a = getRandomNonZeroInt(-4, 4);
          const q = `${fmtTerm(k, X+'^2', true)}${fmtTerm(k*a, X)}`;
          const ans = `(${simplify(k, termX, null, null, 0)})(${simplify(1, termX, null, null, a)})`;
          return { question: q, answer: ans };
        } else {
          const q = `${fmtTerm(k, X+'^2', true)}${fmtTerm(k, X+Y)}`;
          const ans = `(${simplify(k, termX, null, null, 0)})(${simplify(1, termX, 1, termY, 0)})`;
          return { question: q, answer: ans };
        }
      } else if (baseLevel === 2) {
        const subType = getRandomInt(1, 3);
        if (subType === 1) {
          const a = getRandomNonZeroInt(-4, 4);
          let b = getRandomNonZeroInt(-4, 4); if (a === b) b++;
          if (!isBaseHomogeneous) {
            const q = `${X}^2${fmtTerm(a+b, X)}${fmtConst(a*b)}`;
            const ans = `(${simplify(1, termX, null, null, a)})(${simplify(1, termX, null, null, b)})`;
            return { question: q, answer: ans };
          } else {
            const q = `${X}^2${fmtTerm(a+b, X+Y)}${fmtTerm(a*b, Y+'^2')}`;
            const ans = `(${simplify(1, termX, a, termY, 0)})(${simplify(1, termX, b, termY, 0)})`;
            return { question: q, answer: ans };
          }
        } else if (subType === 2) {
          const a = getRandomNonZeroInt(-4, 4);
          if (!isBaseHomogeneous) {
            const q = `${X}^2${fmtTerm(2*a, X)}${fmtConst(a*a)}`;
            const ans = `(${simplify(1, termX, null, null, a)})^2`;
            return { question: q, answer: ans };
          } else {
            const q = `${X}^2${fmtTerm(2*a, X+Y)}${fmtTerm(a*a, Y+'^2')}`;
            const ans = `(${simplify(1, termX, a, termY, 0)})^2`;
            return { question: q, answer: ans };
          }
        } else {
          const a = getRandomInt(1, 6);
          if (!isBaseHomogeneous) {
            const q = `${X}^2-${a*a}`;
            const ans = `(${simplify(1, termX, null, null, -a)})(${simplify(1, termX, null, null, a)})`;
            return { question: q, answer: ans };
          } else {
            const q = `${X}^2${fmtTerm(-a*a, Y+'^2')}`;
            const ans = `(${simplify(1, termX, -a, termY, 0)})(${simplify(1, termX, a, termY, 0)})`;
            return { question: q, answer: ans };
          }
        }
      } else {
        const a = getRandomNonZeroInt(-2, 2);
        const c = getRandomNonZeroInt(-2, 2);
        const b = getRandomNonZeroInt(-3, 3);
        const d = getRandomNonZeroInt(-3, 3);
        const c2 = a*c, c1 = a*d+b*c, c0 = b*d;
        if (!isBaseHomogeneous) {
          const q = `${fmtTerm(c2, X+'^2', true)}${fmtTerm(c1, X)}${fmtConst(c0)}`;
          const ans = `(${simplify(a, termX, null, null, b)})(${simplify(c, termX, null, null, d)})`;
          return { question: q, answer: ans };
        } else {
          const q = `${fmtTerm(c2, X+'^2', true)}${fmtTerm(c1, X+Y)}${fmtTerm(c0, Y+'^2')}`;
          const ans = `(${simplify(a, termX, b, termY, 0)})(${simplify(c, termX, d, termY, 0)})`;
          return { question: q, answer: ans };
        }
      }
    },

    // レベル5: 最低次数について整理 (旧レベル7)
    level5: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1];
      const a = getRandomNonZeroInt(-3, 3);
      const q = `${v1}^2 + ${v1}${v2} ${fmtTerm(a - 1, v1)} - ${v2} ${fmtConst(-a)}`;
      const ans = `(${v1}-1)(${v1}+${v2}${fmtConst(a)})`;
      return { question: q, answer: ans };
    },

    // レベル6: 高度な組み合わせ・多段因数分解 (新設)
    level6: () => {
      const g = getRandGroup();
      const v = g[0];
      const type = getRandomInt(1, 6);
      
      if (type === 1) { // 組み換えによる平方の差: x^2 + 2ax + a^2 - y^2
        const v2 = g[1];
        const a = getRandomNonZeroInt(-4, 4);
        const q = `${v}^2 ${fmtTerm(2*a, v)} ${fmtConst(a*a)} - ${v2}^2`;
        const ans = `(${v}${fmtConst(a)}+${v2})(${v}${fmtConst(a)}-${v2})`;
        return { question: q, answer: ans };
      } else if (type === 2) { // 共通因数と置き換えの複合 (ユーザー例示参考)
        const v2 = g[1], v3 = g[2];
        const k = getRandomNonZeroInt(2, 3);
        // k*c * ((a-b)^2 + 2(a-b)*2c + (2c)^2) = k*c * (a-b+2c)^2
        const q = `${k}${v3}${v[0]}^2 - ${2*k}${v3}${v[0]}${v2} + ${k}${v3}${v2}^2 + ${4*k}(${v[0]}-${v2})${v3}^2 + ${4*k}${v3}^3`;
        const ans = `${k}${v3}(${v[0]}-${v2}+2${v3})^2`;
        return { question: q, answer: ans };
      } else if (type === 3) { // (x+a)(x+b)(x+c)(x+d)+k (a+b=c+d)
        // (x+1)(x+2)(x+3)(x+4)-48 -> (x^2+5x+4)(x^2+5x+6)-48
        const a=1, b=4, c=2, d=3, k=-48;
        const q = `(${v}+1)(${v}+2)(${v}+3)(${v}+4)${k}`;
        const ans = `(${v}^2+5${v}+12)(${v}^2+5${v}-2)`;
        return { question: q, answer: ans };
      } else if (type === 4) { // (x+a)(x+b)(x+c)(x+d)+kx^2 (ac=bd)
        // (x-1)(x-2)(x+2)(x+4)+2x^2
        const q = `(${v}-1)(${v}-2)(${v}+2)(${v}+4)+2${v}^2`;
        const ans = `(${v}^2+${v}-4)(${v}^2+2${v}-4)`;
        return { question: q, answer: ans };
      } else if (type === 5) { // 多段置き換え: (x^2+x)^2 - 8(x^2+x) + 12
        const q = `(${v}^2+${v})^2 - 8(${v}^2+${v}) + 12`;
        const ans = `(${v}+3)(${v}-2)(${v}+2)(${v}-1)`;
        return { question: q, answer: ans };
      } else { // 共通因数くくり出し後の多段分解
        // x(x+1)^2 + 2(x+1)(2x+1)... (修正版)
        const q = `${v}^2(${v}+1)^2 + 2${v}(${v}+1)(2${v}+1) + 4${v}(${v}+1)`;
        const ans = `${v}(${v}+1)(${v}+2)(${v}+3)`;
        return { question: q, answer: ans };
      }
    },

    // レベル7: 複2次式 (旧レベル6)
    level7: () => {
      const g = getRandGroup();
      const v = g[0];
      const subType = Math.random() > 0.5 ? 1 : 2;
      if (subType === 1) { // (x^2+a)(x^2+b)
        const a = getRandomInt(1, 4);
        const b = getRandomInt(5, 9);
        const q = `${v}^4 ${fmtTerm(a + b, v+'^2')} ${fmtConst(a * b)}`;
        const ans = `(${v}^2+${a})(${v}^2+${b})`;
        return { question: q, answer: ans };
      } else { // x^4 + x^2 + 1 = (x^2+x+1)(x^2-x+1)
        const q = `${v}^4 + ${v}^2 + 1`;
        const ans = `(${v}^2+${v}+1)(${v}^2-${v}+1)`;
        return { question: q, answer: ans };
      }
    },

    // レベル8: 3次の公式 (旧レベル7)
    level8: () => {
      const g = getRandGroup();
      const v = g[0];
      const subType = Math.random() > 0.5 ? 1 : 2;
      const a = getRandomNonZeroInt(-3, 3);
      if (subType === 1) { // (x+a)^3
        // x^3 + 3ax^2 + 3a^2x + a^3
        const q = `${v}^3${fmtTerm(3 * a, v+'^2')}${fmtTerm(3 * a * a, v)}${fmtConst(a * a * a)}`;
        const ans = `(${v}${fmtConst(a)})^3`;
        return { question: q, answer: ans };
      } else { // x^3 + a^3 = (x+a)(x^2-ax+a^2)
        const aVal = Math.abs(a);
        const sign = a > 0 ? '+' : '-';
        const q = `${v}^3${sign}${aVal * a * a}`;
        const ans = `(${v}${fmtConst(a)})(${v}^2${fmtTerm(-a, v)}${fmtConst(a * a)})`;
        return { question: q, answer: ans };
      }
    },

    // レベル9: 因数定理 (旧レベル8)
    level9: () => {
      const g = getRandGroup();
      const v = g[0];
      const r = getRandomNonZeroInt(-3, 3);
      const b = getRandomInt(-3, 3);
      const c = getRandomNonZeroInt(-4, 4);
      // (x-r)(x^2+bx+c) = x^3 + (b-r)x^2 + (c-rb)x - rc
      const coeff2 = b - r;
      const coeff1 = c - r * b;
      const coeff0 = -r * c;
      const q = `${v}^3${fmtTerm(coeff2, v+'^2')}${fmtTerm(coeff1, v)}${fmtConst(coeff0)}`;
      const ans = `(${v}${fmtConst(-r)})(${v}^2${fmtTerm(b, v)}${fmtConst(c)})`;
      return { question: q, answer: ans };
    },

    // レベル10: 2元2次6項 (旧レベル9)
    level10: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1];
      // (x+y+1)(x+2y+1) = x^2 + 3xy + 2y^2 + 2x + 3y + 1
      const q = `${v1}^2 + 3${v1}${v2} + 2${v2}^2 + 2${v1} + 3${v2} + 1`;
      const ans = `(${v1}+${v2}+1)(${v1}+2${v2}+1)`;
      return { question: q, answer: ans };
    },

    // レベル11: 3変数対称式・交代式 (旧レベル10)
    level11: () => {
      const g = getRandGroup();
      const a = g[0], b = g[1], c = g[2];
      const q = `${a}^2(${b}-${c}) + ${b}^2(${c}-${a}) + ${c}^2(${a}-${b})`;
      const ans = `-(${a}-${b})(${b}-${c})(${c}-${a})`;
      return { question: q, answer: ans };
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
