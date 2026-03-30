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
  
  // Braces to parens
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  
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

const targetLatex = "-\\frac{4}{3}\\left\\{(-2)^n - 1\\right\\}"; // This simulates String.raw Output
console.log("Target Latex:", targetLatex);

const cleaned = cleanMath(targetLatex);
console.log("Cleaned:", cleaned);

try {
    const node = math.parse(cleaned);
    console.log("Parsed successfully.");
    const val = node.evaluate({ n: 5 });
    console.log("Evaluated at n=5:", val);
    
    // Test with a likely user input (where MyScript might just give -4/3((-2)^n-1))
    const userInput = "- \\frac{4}{3} ((-2)^{n} - 1)";
    const cleanedInput = cleanMath(userInput);
    console.log("Cleaned Input:", cleanedInput);
    const nodeInput = math.parse(cleanedInput);
    console.log("Input Evaluated at n=5:", nodeInput.evaluate({ n: 5 }));
    
} catch (e) {
    console.error("Error:", e.message);
}
