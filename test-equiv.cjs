const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  // IMPROVED: Handle optional spaces in \frac
  s = s.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '(($1)/($2))');
  
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
  // 1. Digit/Var before Paren: 2( -> 2*(, n( -> n*(
  s = s.replace(/([0-9a-z])(\()/gi, '$1*$2');
  // 2. Paren before Digit/Var: )2 -> )*2, )n -> )*n
  s = s.replace(/(\))([0-9a-z])/gi, '$1*$2');
  // 3. Digit before Var: 2n -> 2*n
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  // 4. Var before Var: xy -> x*y
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  // 5. Paren before Paren: )( -> )*(
  s = s.replace(/\)\(/g, ')*(');
  
  return s;
};

const target = "-\\frac{1}{2}n^2+\\frac{9}{2}n"; 
const user1 = "\\frac{n(-n+9)}{2}";
const user2 = "\\frac{-n+9}{2}n";

console.log("Cleanup Test:");
[target, user1, user2].forEach(l => {
    console.log(`- RAW: ${l}`);
    console.log(`  CLEANED: ${cleanMath(l)}`);
});

try {
    const scope = { n: 5 };
    const tVal = math.parse(cleanMath(target)).evaluate(scope);
    const u1Val = math.parse(cleanMath(user1)).evaluate(scope);
    const u2Val = math.parse(cleanMath(user2)).evaluate(scope);
    
    console.log(`\nEvaluation at n=5:`);
    console.log(`Target: ${tVal}`);
    console.log(`User 1: ${u1Val} (Match? ${tVal === u1Val})`);
    console.log(`User 2: ${u2Val} (Match? ${tVal === u2Val})`);
} catch (e) {
    console.error("Error:", e.message);
}
