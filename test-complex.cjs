const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  s = s.replace(/\\frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '(($1)/($2))');
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');

  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); 
  
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  
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

// Failing Case
const target = "\\frac{3}{4}\\{(-3)^n-1\\}";
const user = "-\\frac{1}{4}\\{3+(-3)^{n+1}\\}";

console.log("Cleanup:");
console.log("- Target:", cleanMath(target));
console.log("- User:", cleanMath(user));

try {
    const scope = { n: 5 };
    const n1 = math.parse(cleanMath(target));
    const n2 = math.parse(cleanMath(user));
    
    const v1 = n1.evaluate(scope);
    const v2 = n2.evaluate(scope);
    
    console.log(`\nEvaluation (mathjs defaults) at n=5:`);
    console.log(`Target: ${v1} (type: ${typeof v1})`);
    console.log(`User: ${v2} (type: ${typeof v2})`);
    
    // Check if subtraction works
    const diff = math.subtract(v1, v2);
    console.log(`Diff (math.subtract): ${diff}`);
    console.log(`Is Zero? ${math.equal(v1, v2)}`);
    
    // This simulates the current check in App.jsx:
    console.log(`Regular Math.abs(v1-v2) < 1e-7:`, Math.abs(v1 - v2) < 1e-7);
    
} catch (e) {
    console.error("Error:", e.message);
}
