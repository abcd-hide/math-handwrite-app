const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  // IMPROVED: Handle optional spaces and ONE LEVEL of nested braces in \frac
  // Before: s = s.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '(($1)/($2))');
  s = s.replace(/\\frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '(($1)/($2))');
  
  // Handle power notation with braces ^{n} -> ^(n)
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');

  // LaTeX symbols to mathjs
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); 
  
  // Braces/Brackets to parens
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  
  s = s.replace(/\\ /g, ''); 
  s = s.replace(/\\/g, ''); // Remove remaining backslashes
  s = s.replace(/\s+/g, ''); 
  
  // Implicit multiplication: 
  s = s.replace(/([0-9a-z])(\()/gi, '$1*$2');
  s = s.replace(/(\))([0-9a-z])/gi, '$1*$2');
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  s = s.replace(/\)\(/g, ')*(');
  
  return s;
};

const userLatex = "\\frac{(-3)^{n-1}-1}{2}"; 
const targetLatex = "\\frac{1}{2}\\left\\{(-3)^{n-1}-1\\right\\}";

console.log("Cleanup Test:");
[userLatex, targetLatex].forEach(l => {
    console.log(`- RAW: ${l}`);
    const cleaned = cleanMath(l);
    console.log(`  CLEANED: ${cleaned}`);
});

try {
    const scope = { n: 5 };
    const tVal = math.parse(cleanMath(targetLatex)).evaluate(scope);
    const uVal = math.parse(cleanMath(userLatex)).evaluate(scope);
    
    console.log(`\nEvaluation at n=5:`);
    console.log(`Target: ${tVal}`);
    console.log(`User: ${uVal} (Match? ${tVal === uVal})`);
} catch (e) {
    console.error("Error:", e.message);
}
