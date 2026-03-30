
const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  // 1. Remove LaTeX specific non-visible delimiter dots and text tags
  s = s.replace(/\\left\./g, '').replace(/\\right\./g, '');
  s = s.replace(/\\text\s*\{([^}]*)\}/g, '$1');
  s = s.replace(/\\unicode\s*\{([^}]*)\}/g, '');

  // 2. Handle \frac{a}{b} -> ((a)/(b)) with optional spaces and ONE LEVEL of nested braces
  s = s.replace(/\\frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '(($1)/($2))');
  
  // 3. Handle power notation with braces ^{n} -> ^(n)
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');

  // 4. Normalize ALL bracket types to parentheses (handles \left\{, \{, [, etc.)
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\\{/g, '(').replace(/\\\}/g, ')'); 
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');

  // 5. LaTeX symbols to mathjs
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); 
  
  // 6. Final cleanup of LaTeX/whitespace
  s = s.replace(/\\ /g, ''); 
  s = s.replace(/\\/g, ''); 
  s = s.replace(/\s+/g, ''); 
  
  // 7. Implicit multiplication: 
  s = s.replace(/([0-9a-z])(\()/gi, '$1*$2');
  s = s.replace(/(\))([0-9a-z])/gi, '$1*$2');
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  s = s.replace(/\)\(/g, ')*(');

  // 8. Handle simple exponent without braces: ^k -> ^(k)
  // This is a safety measure if MyScript misses braces for single chars
  s = s.replace(/\^([a-z0-9])/gi, '^($1)');
  
  return s;
};

const areEquivalent = (inputLatex, targetMath, isEquation = false) => {
  try {
    const cleanedInput = cleanMath(inputLatex);
    const cleanedTarget = cleanMath(targetMath);
    
    console.log('Cleaned Input:', cleanedInput);
    console.log('Cleaned Target:', cleanedTarget);

    if (cleanedInput === cleanedTarget) return true;

    if (isEquation) {
      return cleanedInput.replace(/\s/g, '').toLowerCase() === cleanedTarget.replace(/\s/g, '').toLowerCase();
    }


    const node1 = math.parse(cleanedInput);
    const node2 = math.parse(cleanedTarget);
    
    // Attempt algebraic simplification of the difference
    try {
      const diffNode = math.parse(`(${cleanedInput}) - (${cleanedTarget})`);
      const simplified = math.simplify(diffNode);
      console.log('Simplified difference:', simplified.toString());
      if (simplified.toString() === '0') return true;
    } catch (e) {
      console.log('Simplify failed:', e.message);
    }

    const testPoints = [
      { x: 1.5, y: 2.7, z: 0.8, a: -2.3, b: 1.2, c: -0.8, p: 0.4, q: -1.2, r: 0.9, s: 1.1, t: -0.5, u: 0.3, i: 1, j: 2, k: 3, m: 4, n: 1 },
      { x: -2.1, y: 0.3, z: -1.5, a: 1.5, b: -2.4, c: 3.1, p: -0.7, q: 0.5, r: -1.1, s: 0.2, t: 1.4, u: -0.9, i: 2, j: 3, k: 4, m: 5, n: 2 },
      { x: 3.2, y: -1.5, z: 2.1, a: 0.5, b: 3.4, c: -1.1, p: 1.2, q: -0.8, r: 0.3, s: -0.4, t: 0.2, u: 1.1, i: 3, j: 4, k: 5, m: 6, n: 3 },
      { x: 0.5, y: 1.1, z: -0.9, a: 2.3, b: -1.2, c: 0.8, p: -0.4, q: 1.2, r: -0.9, s: 1.5, t: -1.1, u: 0.5, i: 4, j: 5, k: 6, m: 7, n: 4 },
      { x: 1.1, y: -0.9, z: 0.5, a: -1.5, b: 2.4, c: -3.1, p: 0.7, q: -0.5, r: 1.1, s: -0.2, t: -1.4, u: 0.9, i: 5, j: 6, k: 7, m: 8, n: 5 },
      { x: 2.2, y: 1.2, z: 3.3, a: 4.4, b: 5.5, c: 6.6, p: 7.7, q: 8.8, r: 9.9, s: 0.1, t: 0.2, u: 0.3, i: 10, j: 11, k: 12, m: 13, n: 10 }
    ];
    
    return testPoints.every((scope, idx) => {
      try {
        const v1 = node1.evaluate(scope);
        const v2 = node2.evaluate(scope);
        const res = math.equal(v1, v2) || math.abs(math.subtract(v1, v2)) < 1e-7;
        if (!res) {
          console.log(`Failed at point ${idx}: n=${scope.n}, v1=${v1}, v2=${v2}`);
        }
        return res;
      } catch (e) {
        console.log(`Error at point ${idx}:`, e.message);
        return false;
      }
    });
  } catch (e) {
    console.warn('Math comparison failed', e);
    return false;
  }
};

const target = "\\frac{1}{2}\\{(-3)^{n-1}-1\\}";
const inputs = [
  "\\frac{(-3)^{n-1}-1}{2}",
  "\\frac{(-3)^{n-1}}{2}-\\frac{1}{2}",
  "\\frac{1}{2}\\{(-3)^{n-1}-1\\}"
];

inputs.forEach(input => {
  console.log(`\nTesting input: ${input}`);
  const result = areEquivalent(input, target);
  console.log(`Result: ${result}`);
});
