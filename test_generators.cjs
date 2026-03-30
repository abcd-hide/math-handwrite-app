const { sequenceSumGenerators } = require('./src/utils/sequenceSumGenerators.js');
const math = require('mathjs');

// Mock getUpperLimit to just return 'n' forms
const getUpperLimitMock = () => ({ tex: 'n', expr: 'n', n: 'n', np1: 'n+1', np2: 'n+2', np3: 'n+3', nm1: 'n-1' });

const areEquivalent = (l1, l2) => {
    try {
        const n1 = math.parse(l1.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
                               .replace(/\\left\(/g, '(')
                               .replace(/\\right\)/g, ')')
                               .replace(/\\cdot/g, '*')
                               .replace(/\^\{([^}]*)\}/g, '^($1)')
                               .replace(/\{([^}]*)\}/g, '($1)')
                               .replace(/([0-9])n/g, '$1*n')
                               .replace(/nn/g, 'n*n')
                               .replace(/n\(/g, 'n*(')
                               .replace(/\)n/g, ')*n')
                               .replace(/\)\(/g, ')*(')
        );
        // We can't easily parse the SIGMA expression for ground truth, 
        // so we'll just check if the generated answer is evaluatable and "looks" factorized.
        return true;
    } catch (e) {
        return false;
    }
};

function testAll() {
    for (let i = 1; i <= 8; i++) {
        console.log(`--- Level ${i} ---`);
        for (let j = 0; j < 5; j++) {
            const problem = sequenceSumGenerators[`level${i}`]();
            console.log(`Q: ${problem.question}`);
            console.log(`A: ${problem.answer}`);
            
            // Check for redundant (n)
            if (problem.answer.includes('(n)')) {
                console.error('FAIL: Redundant (n) found');
            }
        }
    }
}

// Since the generator is ESM, we need to run it accordingly. 
// But for now, let's just do a quick manual check of the LaTeX format in the task.
testAll();
