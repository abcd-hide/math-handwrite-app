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
  ['i', 'j', 'k']
];

const getRandGroup = () => variableGroups[getRandomInt(0, variableGroups.length - 1)];

export const problemGenerators = {
  factorization: {
    // レベル1: 中学くくりだし (3項以上、多文字、定数+文字混合対応)
    level1: () => {
      const g = getRandGroup();
      const v1 = g[0], v2 = g[1], v3 = g[2];
      const subType = getRandomInt(1, 6);
      
      if (subType === 1) { // a(x + b)
        let a = getRandomNonZeroInt(-6, 6);
        if (a === 1 || a === -1) a = 2;
        const b = getRandomNonZeroInt(-6, 6);
        const q = `${fmtTerm(a, v1, true)}${fmtConst(a * b)}`;
        const ans = `${a}(${v1}${fmtConst(b)})`;
        return { question: q, answer: ans };
      } 
      if (subType === 2) { // a(x + y + z) 
        let a = getRandomNonZeroInt(-5, 5);
        if (a === 1 || a === -1) a = 4;
        const q = `${fmtTerm(a, v1, true)}${fmtTerm(a, v2)}${fmtTerm(a, v3)}`;
        const ans = `${a}(${v1}+${v2}+${v3})`;
        return { question: q, answer: ans };
      }
      if (subType === 3) { // x(x + a)
        const a = getRandomNonZeroInt(-6, 6);
        const q = `${v1}^2${fmtTerm(a, v1)}`;
        const ans = `${v1}(${v1}${fmtConst(a)})`;
        return { question: q, answer: ans };
      }
      if (subType === 4) { // x(y + z + a)
        const a = getRandomInt(0, 5);
        const q = `${v1}${v2} + ${v1}${v3}${a === 0 ? '' : fmtTerm(a, v1)}`;
        const ans = `${v1}(${v2}+${v3}${a === 0 ? '' : fmtConst(a)})`;
        return { question: q, answer: ans };
      }
      if (subType === 5) { // ax(x + b)
        let a = getRandomNonZeroInt(-4, 4);
        if (a === 1 || a === -1) a = 3;
        const b = getRandomNonZeroInt(-4, 4);
        const q = `${fmtTerm(a, v1+'^2', true)}${fmtTerm(a*b, v1)}`;
        const ans = `${fmtCoeff(a, true)}${v1}(${v1}${fmtConst(b)})`;
        return { question: q, answer: ans };
      }
      if (subType === 6) { // ab(x + y + c)
        let a = getRandomNonZeroInt(-3, 3);
        if (a === 1 || a === -1) a = 2;
        const q = `${fmtTerm(a, v1+v2, true)}${fmtTerm(a, v1+v3)}${fmtTerm(a, v1)}`;
        const ans = `${fmtCoeff(a, true)}${v1}(${v2}+${v3}+1)`;
        return { question: q, answer: ans };
      }
      return { question: `2x+2y`, answer: `2(x+y)` }; // fallback
    },

    // レベル2: 中学公式 (x+a)(x+b), (x+a)^2, (x+a)(x-a)
    level2: () => {
      const subType = getRandomInt(1, 3);
      if (subType === 1) { // (x+a)(x+b)
        const a = getRandomNonZeroInt(-6, 6);
        let b = getRandomNonZeroInt(-6, 6);
        if (a === b) b += 1;
        const q = `x^2${fmtTerm(a + b, 'x')}${fmtConst(a * b)}`;
        const ans = `(x${fmtConst(a)})(x${fmtConst(b)})`;
        return { question: q, answer: ans };
      } else if (subType === 2) { // (x+a)^2
        const a = getRandomNonZeroInt(-6, 6);
        const q = `x^2${fmtTerm(2 * a, 'x')}${fmtConst(a * a)}`;
        const ans = `(x${fmtConst(a)})^2`;
        return { question: q, answer: ans };
      } else { // (x+a)(x-a)
        const a = getRandomInt(1, 10);
        const q = `x^2-${a * a}`;
        const ans = `(x-${a})(x+${a})`;
        return { question: q, answer: ans };
      }
    },

    // レベル3: たすきがけ (ax+b)(cx+d)
    level3: () => {
      const a = getRandomInt(1, 3);
      const c = getRandomInt(2, 4);
      const b = getRandomNonZeroInt(-5, 5);
      const d = getRandomNonZeroInt(-5, 5);
      // (ax+b)(cx+d) = ac x^2 + (ad+bc)x + bd
      const coeff2 = a * c;
      const coeff1 = a * d + b * c;
      const coeff0 = b * d;
      const q = `${fmtTerm(coeff2, 'x^2', true)}${fmtTerm(coeff1, 'x')}${fmtConst(coeff0)}`;
      const ans = `(${a === 1 ? '' : a}x${fmtConst(b)})(${c}x${fmtConst(d)})`;
      return { question: q, answer: ans };
    },

    // レベル4: 文字の置き換え (X+a)(X+b) where X=(x+y)
    level4: () => {
      const a = getRandomNonZeroInt(-4, 4);
      const b = getRandomNonZeroInt(-4, 4);
      // (x+y)^2 + (a+b)(x+y) + ab
      const q = `(x+y)^2${fmtTerm(a + b, '(x+y)')}${fmtConst(a * b)}`;
      const ans = `(x+y${fmtConst(a)})(x+y${fmtConst(b)})`;
      return { question: q, answer: ans };
    },

    // レベル5: 3次の公式 (x+a)^3 or (x+a)(x^2-ax+a^2)
    level5: () => {
      const subType = Math.random() > 0.5 ? 1 : 2;
      const a = getRandomNonZeroInt(-3, 3);
      if (subType === 1) { // (x+a)^3
        // x^3 + 3ax^2 + 3a^2x + a^3
        const q = `x^3${fmtTerm(3 * a, 'x^2')}${fmtTerm(3 * a * a, 'x')}${fmtConst(a * a * a)}`;
        const ans = `(x${fmtConst(a)})^3`;
        return { question: q, answer: ans };
      } else { // x^3 + a^3 = (x+a)(x^2-ax+a^2)
        const aVal = Math.abs(a);
        const sign = a > 0 ? '+' : '-';
        const q = `x^3${sign}${aVal * a * a}`;
        const ans = `(x${fmtConst(a)})(x^2${fmtTerm(-a, 'x')}${fmtConst(a * a)})`;
        return { question: q, answer: ans };
      }
    },

    // レベル6: 因数定理 (x-r)(ax^2+bx+c)
    level6: () => {
      const r = getRandomNonZeroInt(-3, 3);
      const a = 1;
      const b = getRandomInt(-3, 3);
      const c = getRandomNonZeroInt(-4, 4);
      // (x-r)(x^2+bx+c) = x^3 + (b-r)x^2 + (c-rb)x - rc
      const coeff3 = 1;
      const coeff2 = b - r;
      const coeff1 = c - r * b;
      const coeff0 = -r * c;
      const q = `x^3${fmtTerm(coeff2, 'x^2')}${fmtTerm(coeff1, 'x')}${fmtConst(coeff0)}`;
      const ans = `(x${fmtConst(-r)})(x^2${fmtTerm(b, 'x')}${fmtConst(c)})`;
      return { question: q, answer: ans };
    },

    // レベル7: 最低次数について整理 (x+a)(y+b) + c? No, e.g. x^2 + xy + x - y - 2
    // Let's use (x-1)(x+y+a) = x^2 + xy + ax - x - y - a = x^2 + xy + (a-1)x - y - a
    level7: () => {
      const a = getRandomNonZeroInt(-3, 3);
      const q = `x^2 + xy ${fmtTerm(a - 1, 'x')} - y ${fmtConst(-a)}`;
      const ans = `(x-1)(x+y${fmtConst(a)})`;
      return { question: q, answer: ans };
    },

    // レベル8: 2元2次6項 (ax+by+c)(dx+ey+f)
    level8: () => {
      // (x+y+1)(x+2y+1) = x^2 + 3xy + 2y^2 + 2x + 3y + 1
      const q = `x^2 + 3xy + 2y^2 + 2x + 3y + 1`;
      const ans = `(x+y+1)(x+2y+1)`;
      return { question: q, answer: ans };
    },

    // レベル9: 複2次式 (x^2+a)(x^2+b) or (x^2+ax+b)(x^2-ax+b)
    level9: () => {
      const subType = Math.random() > 0.5 ? 1 : 2;
      if (subType === 1) { // (x^2+a)(x^2+b)
        const a = getRandomInt(1, 4);
        const b = getRandomInt(5, 9);
        const q = `x^4 ${fmtTerm(a + b, 'x^2')} ${fmtConst(a * b)}`;
        const ans = `(x^2+${a})(x^2+${b})`;
        return { question: q, answer: ans };
      } else { // x^4 + x^2 + 1 = (x^2+x+1)(x^2-x+1)
        const q = `x^4 + x^2 + 1`;
        const ans = `(x^2+x+1)(x^2-x+1)`;
        return { question: q, answer: ans };
      }
    },

    // レベル10: 3変数対称式・交代式
    level10: () => {
      const q = `a^2(b-c) + b^2(c-a) + c^2(a-b)`;
      const ans = `-(a-b)(b-c)(c-a)`;
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
