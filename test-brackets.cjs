const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  // Handle \frac{a}{b} -> ((a)/(b))
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '(($1)/($2))');
  
  // Handle power notation with braces ^{n} -> ^(n)
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');

  // LaTeX symbols to mathjs
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); 
  
  // Braces/Brackets to parens
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')'); // Proposed fix
  
  s = s.replace(/\\ /g, ''); 
  s = s.replace(/\\/g, ''); // Remove remaining backslashes
  s = s.replace(/\s+/g, ''); 
  
  // Implicit multiplication
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  s = s.replace(/([a-z])(\()/gi, '$1*$2');
  s = s.replace(/(\))([a-z0-9])/gi, '$1*$2');
  s = s.replace(/\)\(/g, ')*(');
  
  return s;
};

const targetLatex = "-8 [ 2^{n+1} - 1 ]"; // From user's example
const userInput = "8 - 2^{n+4}";

const cleanedTarget = cleanMath(targetLatex);
const cleanedUser = cleanMath(userInput);

console.log("Cleaned Target:", cleanedTarget);
console.log("Cleaned User:", cleanedUser);

try {
    const node1 = math.parse(cleanedTarget);
    const node2 = math.parse(cleanedUser);
    
    const scope = { n: 5 };
    const v1 = node1.evaluate(scope);
    const v2 = node2.evaluate(scope);
    
    console.log("Target val at n=5:", v1);
    console.log("User val at n=5:", v2);
    console.log("Equivalent?", Math.abs(v1 - v2) < 1e-7);
} catch (e) {
    console.error("Error:", e.message);
}
