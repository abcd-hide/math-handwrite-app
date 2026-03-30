import * as math from 'mathjs';

function testRationalize() {
    const NStr = 'n-1';
    
    // Sum formulas in terms of N
    const s3 = `(${NStr})^2 * ((${NStr}) + 1)^2 / 4`;
    const s2 = `(${NStr}) * ((${NStr}) + 1) * (2*(${NStr}) + 1) / 6`;
    const s1 = `(${NStr}) * ((${NStr}) + 1) / 2`;
    const s0 = `(${NStr})`;
    
    // a=4, b=-6, c=4, d=-2
    const exprStr = `4*(${s3}) - 6*(${s2}) + 4*(${s1}) - 2*(${s0})`;
    
    const rat = math.rationalize(exprStr);
    console.log('Rationalized:', rat.toString());
    
    // For n^4 - 4n^3 + 6n^2 - 5n + 2, rationalize should give exactly that.
    
    // Let's try another one with fractions that don't cancel nicely.
    // sum k^2 from 1 to n = 1/3 n^3 + 1/2 n^2 + 1/6 n
    console.log('Sum k^2:', math.rationalize('n*(n+1)*(2n+1)/6').toString());
}

testRationalize();
