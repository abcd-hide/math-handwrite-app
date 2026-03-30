const math = require('mathjs');

const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  // IMPROVED: Handle optional spaces and ONE LEVEL of nested braces in \frac
  s = s.replace(/\\frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '(($1)/($2))');
  
  // IMPROVED: Handle power notation with OR without braces
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');
  // Add support for simple exponents without braces if they are digits or single letters
  // s = s.replace(/\^([0-9a-z])/gi, '^($1)'); // mathjs handles ^2 fine, but we can be explicit

  // LaTeX symbols to mathjs
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); 
  
  // Braces/Brackets to parens
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  
  s = s.replace(/\\ /g, ''); 
  s = s.replace(/\\/g, ''); 
  s = s.replace(/\s+/g, ''); 
  
  // Implicit multiplication: 
  s = s.replace(/([0-9a-z])(\()/gi, '$1*$2');
  s = s.replace(/(\))([0-9a-z])/gi, '$1*$2');
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  s = s.replace(/\)\(/g, ')*(');
  
  return s;
};

const case1_target = "2^{n+2}";
const case1_user = "4 \\cdot 2^{n}";

const case2_target = "-8[2^{n+1}-1]";
const case2_user = "8 - 2^{n+4}";

console.log("Cleanup Test:");
[case1_target, case1_user, case2_target, case2_user].forEach(l => {
    console.log(`- RAW: ${l}`);
    const cleaned = cleanMath(l);
    console.log(`  CLEANED: ${cleaned}`);
});

try {
    const scope = { n: 5 };
    
    const v1t = math.parse(cleanMath(case1_target)).evaluate(scope);
    const v1u = math.parse(cleanMath(case1_user)).evaluate(scope);
    console.log(`\nCase 1 (2^{n+2} vs 4*2^n): ${v1t} vs ${v1u} (Match? ${v1t === v1u})`);

    const v2t = math.parse(cleanMath(case2_target)).evaluate(scope);
    const v2u = math.parse(cleanMath(case2_user)).evaluate(scope);
    console.log(`\nCase 2 (-8[2^{n+1}-1] vs 8-2^{n+4}): ${v2t} vs ${v2u} (Match? ${v2t === v2u})`);

} catch (e) {
    console.error("Error:", e.message);
}
