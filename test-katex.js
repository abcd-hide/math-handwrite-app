import katex from 'katex';
try {
  const q1 = "\\displaystyle x^2+x";
  console.log("Q1:");
  console.log(katex.renderToString(q1));
} catch(e) {
  console.log("Q1 ERROR:", e.message);
}
try {
  const q2 = "\\displaystyle \\displaystyle\\sum_{k=1}^{n} (k)";
  console.log("Q2:");
  console.log(katex.renderToString(q2));
} catch(e) {
  console.log("Q2 ERROR:", e.message);
}
