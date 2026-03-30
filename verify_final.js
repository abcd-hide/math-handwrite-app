import { sequenceSumGenerators } from './src/utils/sequenceSumGenerators.js';
import * as math from 'mathjs';

function cleanLatex(s) {
    return s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
            .replace(/\\left\{/g, '(').replace(/\\right\}/g, ')')
            .replace(/\\left\[/g, '(').replace(/\\right\]/g, ')')
            .replace(/\\cdot/g, '*')
            .replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1)/($2)')
            .replace(/\^\{(.+?)\}/g, '^($1)')
            .replace(/n/g, '(n)')
            .replace(/k/g, '(k)')
            .replace(/\\sum_\{(.*?)\}\^\{(.*?)\}\s*(.*)/g, 'sum($3, $1, $2)');
}

function verify() {
    console.log('--- Verifying Generators ---');
    for (let level = 1; level <= 8; level++) {
        console.log(`\nLevel ${level}:`);
        for (let i = 0; i < 3; i++) {
            const gen = sequenceSumGenerators[`level${level}`]();
            console.log(`Q: ${gen.question}`);
            console.log(`A: ${gen.answer}`);
            
            // Basic formatting check
            if (gen.answer.includes('1n') && !gen.answer.includes('11n')) console.warn('  WARN: Found 1n');
            if (gen.answer.includes('+-')) console.warn('  WARN: Found +-');
            if (gen.answer.includes('-+')) console.warn('  WARN: Found -+');
            if (gen.answer.includes('(n-1^2)')) console.warn('  WARN: Found (n-1^2)');
        }
    }
}

verify();
