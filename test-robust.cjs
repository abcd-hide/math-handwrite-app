const math = require('mathjs');

const areEquivalent = (l1, l2) => {
    try {
        const n1 = math.parse(l1);
        const n2 = math.parse(l2);
        
        const testPoints = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }];
        
        return testPoints.every(scope => {
            try {
                const v1 = n1.evaluate(scope);
                const v2 = n2.evaluate(scope);
                // math.equal handles numbers, complex, bigNumbers, etc.
                if (math.equal(v1, v2)) return true;
                // fallback for floating point
                const diff = math.subtract(v1, v2);
                return math.abs(diff) < 1e-7;
            } catch (e) {
                return false;
            }
        });
    } catch (e) {
        return false;
    }
};

const l1 = "((3)/(4))*((-3)^n-1)";
const l2 = "-((1)/(4))*(3+(-3)^(n+1))";

console.log("Equivalent?", areEquivalent(l1, l2));
