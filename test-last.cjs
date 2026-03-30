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
        const node1 = math.parse(c1);
        const node2 = math.parse(c2);
        const testPoints = [
          { x: 1.5, y: 2.7, z: 0.8, a: -2.3, b: 1.2, c: -0.8, p: 0.4, q: -1.2, r: 0.9, s: 1.1, t: -0.5, u: 0.3, i: 1, j: 2, k: 3, m: 4, n: 1 },
          { x: -2.1, y: 0.3, z: -1.5, a: 1.5, b: -2.4, c: 3.1, p: -0.7, q: 0.5, r: -1.1, s: 0.2, t: 1.4, u: -0.9, i: 2, j: 3, k: 4, m: 5, n: 2 },
          { x: 3.2, y: -1.5, z: 2.1, a: 0.5, b: 3.4, c: -1.1, p: 1.2, q: -0.8, r: 0.3, s: -0.4, t: 0.2, u: 1.1, i: 3, j: 4, k: 5, m: 6, n: 3 },
          { x: 0.5, y: 1.1, z: -0.9, a: 2.3, b: -1.2, c: 0.8, p: -0.4, q: 1.2, r: -0.9, s: 1.5, t: -1.1, u: 0.5, i: 4, j: 5, k: 6, m: 7, n: 4 },
          { x: 1.1, y: -0.9, z: 0.5, a: -1.5, b: 2.4, c: -3.1, p: 0.7, q: -0.5, r: 1.1, s: -0.2, t: -1.4, u: 0.9, i: 5, j: 6, k: 7, m: 8, n: 5 },
          { x: 2.2, y: 1.2, z: 3.3, a: 4.4, b: 5.5, c: 6.6, p: 7.7, q: 8.8, r: 9.9, s: 0.1, t: 0.2, u: 0.3, i: 10, j: 11, k: 12, m: 13, n: 10 }
        ];
        return testPoints.every(scope => {
            try {
                const v1 = node1.evaluate(scope);
                const v2 = node2.evaluate(scope);
                if (math.equal(v1, v2)) return true;
                const diff = math.abs(math.subtract(v1, v2));
                return diff < 1e-7;
            } catch (e) { return false; }
        });
    } catch (e) { return false; }
};

const target = "\\frac{3}{2}(3^n-1)";
const user1 = "\\frac{1}{2}(3^{n+1}-3)";
const user2 = "\\frac{3^{n+1}}{2}-\\frac{3}{2}";
const userExact = "\\frac{3}{2}(3^n-1)";

console.log("Cleanup check:");
[target, user1, user2].forEach(l => console.log(`${l} -> ${cleanMath(l)}`));

console.log("\nEquivalence checks:");
console.log("- User1 vs Target:", areEquivalent(user1, target));
console.log("- User2 vs Target:", areEquivalent(user2, target));
console.log("- UserExact vs Target:", areEquivalent(userExact, target));

try {
    const scope = { n: 2 };
    const n1 = math.parse(cleanMath(target));
    const n2 = math.parse(cleanMath(user1));
    console.log("\nEvaluation at n=2:");
    console.log(`Target: ${n1.evaluate(scope)}`);
    console.log(`User1: ${n2.evaluate(scope)}`);
} catch (e) {}
