const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  s = s.replace(/\\left\./g, '').replace(/\\right\./g, '');
  s = s.replace(/\\frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '(($1)/($2))');
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\\{/g, '(').replace(/\\\}/g, ')'); 
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); 
  s = s.replace(/\\ /g, ''); 
  s = s.replace(/\\/g, ''); 
  s = s.replace(/\s+/g, ''); 
  s = s.replace(/([0-9a-z])(\()/gi, '$1*$2');
  s = s.replace(/(\))([0-9a-z])/gi, '$1*$2');
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  s = s.replace(/\)\(/g, ')*(');
  
  return s;
};

const areEquivalent = (l1, l2) => {
    try {
        const c1 = cleanMath(l1);
        const c2 = cleanMath(l2);
        const n1 = math.parse(c1);
        const n2 = math.parse(c2);
        
        const testPoints = [
          { x: 1.5, y: 2.7, z: 0.8, a: -2.3, b: 1.2, c: -0.8, p: 0.4, q: -1.2, r: 0.9, s: 1.1, t: -0.5, u: 0.3, i: 1, j: 2, k: 3, m: 4, n: 1 },
          { x: -2.1, y: 0.3, z: -1.5, a: 1.5, b: -2.4, c: 3.1, p: -0.7, q: 0.5, r: -1.1, s: 0.2, t: 1.4, u: -0.9, i: 2, j: 3, k: 4, m: 5, n: 2 },
          { n: 3 }, { n: 4 }, { n: 5 }, { n: 10 }
        ];
        
        return testPoints.every(scope => {
            try {
                const v1 = n1.evaluate(scope);
                const v2 = n2.evaluate(scope);
                if (math.equal(v1, v2)) return true;
                const diff = math.abs(math.subtract(v1, v2));
                return diff < 1e-7;
            } catch (e) {
                return false;
            }
        });
    } catch (e) {
        return false;
    }
};

console.log("TEST 1: Exact Match (Arithmetic)");
const f1 = "\\frac{3}{2}n^2-\\frac{7}{2}n"; // I assume user meant this
console.log("- Result:", areEquivalent(f1, f1));

console.log("TEST 2: Poly vs Factored (Arithmetic)");
const f1_user = "\\frac{n}{2}(3n-7)";
console.log("- Result:", areEquivalent(f1_user, f1));

console.log("TEST 3: Exact Match (Geometric)");
const f2 = "-\\frac{1}{2}(3^{n-1}-1)";
console.log("- Result:", areEquivalent(f2, f2));

console.log("TEST 4: Algebraic Variants (Geometric)");
console.log("- Variant 1 (1-3...):", areEquivalent("\\frac{1-3^{n-1}}{2}", f2));
console.log("- Variant 2 (-3/2 + 1/2):", areEquivalent("-\\frac{3^{n-1}}{2}+\\frac{1}{2}", f2));

console.log("\nCleanup for f2 (exact):", cleanMath(f2));

try {
    const scope = { n: 2 };
    const p1 = math.parse(cleanMath(f2));
    console.log("f2 evaluation at n=2:", p1.evaluate(scope));
} catch (e) {
    console.log("Error in f2:", e.message);
}
