import { generateProblem } from './src/utils/problemGenerators.js';

const testSequentialSums = () => {
  console.log('--- Sequential Sums Verification ---');
  
  const levels = [1, 2, 3, 4, 5, 6, 7, 8];
  const counts = { 1: 2, 2: 4, 3: 4, 4: 4, 5: 6, 6: 2, 7: 4, 8: 4 };

  levels.forEach(lvl => {
    console.log(`\nTesting Level ${lvl} (Expected patterns: ${counts[lvl]})`);
    for (let i = 0; i < counts[lvl]; i++) {
      // Simulate App.jsx logic
      let forcedType = i + 1;
      let forcedLimit = 'n';
      const prob = generateProblem('sequence_sum', lvl, forcedType, forcedLimit);
      
      const q = prob.question;
      const isNLit = q.includes('k=1}^{n}');
      console.log(`Problem ${i+1} : Question Limit OK: ${isNLit}`);
      if (!isNLit) {
          console.error(`FAILED: Expected limit 'n' but got: ${q}`);
      }
    }
  });
};

testSequentialSums();
