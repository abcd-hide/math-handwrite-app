import React, { useState, useEffect, useRef } from 'react';
import { Trash2, CheckCircle2, XCircle, Trophy, Settings, PenTool, Eraser, Pen, Eye, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as math from 'mathjs';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import MathCanvas from './components/MathCanvas';
import './index.css';

// Function to clean MyScript LaTeX and make it mathjs-friendly
const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\\ /g, ''); // Remove latex spaces
  s = s.replace(/(\d)\(/g, '$1*('); // 2(x) -> 2*(x)
  s = s.replace(/\)\(/g, ')*('); // (x)(y) -> (x)*(y)
  return s;
};

// Robust check for mathematical equivalence
const areEquivalent = (inputLatex, targetMath, isEquation = false) => {
  try {
    const cleanedInput = cleanMath(inputLatex);
    
    if (isEquation) {
      // For equations like x=4, just check string equality on cleaned versions
      return cleanedInput.replace(/\s/g, '').toLowerCase() === targetMath.replace(/\s/g, '').toLowerCase();
    }

    // For expressions (factorization, etc.), evaluate at random points
    const node1 = math.parse(cleanedInput);
    const node2 = math.parse(targetMath);
    
    // Test with multiple points to be safe
    const testPoints = [1.5, 2.7, -3.1];
    return testPoints.every(x => {
      const v1 = node1.evaluate({ x });
      const v2 = node2.evaluate({ x });
      return Math.abs(v1 - v2) < 1e-8;
    });
  } catch (e) {
    console.warn('Math comparison failed', e);
    return false;
  }
};

const generateProblems = () => [
  { id: 1, type: '方程式を解け', question: '2x + 5 = 13', answer: 'x=4', check: (input) => areEquivalent(input, 'x=4', true) },
  { id: 2, type: '因数分解せよ', question: 'x^2 - 4', answer: '(x-2)(x+2)', check: (input) => areEquivalent(input, '(x-2)*(x+2)') },
  { id: 3, type: '計算せよ', question: '\\sqrt{144}', answer: '12', check: (input) => areEquivalent(input, '12') },
  { id: 4, type: '方程式を解け', question: '3(x + 2) = 15', answer: 'x=3', check: (input) => areEquivalent(input, 'x=3', true) },
];

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  const [problems] = useState(generateProblems());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scratchpadInput, setScratchpadInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tool, setTool] = useState('pen'); 
  const [showSolution, setShowSolution] = useState(false);
  
  const scratchpadRef = useRef();
  const answerAreaRef = useRef();

  const [keys, setKeys] = useState({
    app: localStorage.getItem('ms-app-key') || '',
    hmac: localStorage.getItem('ms-hmac-key') || ''
  });

  const currentProblem = problems[currentIdx];

  const checkAnswer = () => {
    if (!answerInput) return;
    const correct = currentProblem.check(answerInput);
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 10);
    }
  };

  const nextProblem = () => {
    setIsCorrect(null);
    setShowSolution(false);
    handleClear();
    setCurrentIdx((prev) => (prev + 1) % problems.length);
  };

  const handleClear = () => {
    setAnswerInput('');
    setScratchpadInput('');
    setIsCorrect(null);
    if (scratchpadRef.current) scratchpadRef.current.clear();
    if (answerAreaRef.current) answerAreaRef.current.clear();
  };

  const toggleSolution = () => setShowSolution(!showSolution);

  const saveKeys = (e) => {
    e.preventDefault();
    localStorage.setItem('ms-app-key', keys.app);
    localStorage.setItem('ms-hmac-key', keys.hmac);
    setShowSettings(false);
    window.location.reload();
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo">MathHandwrite Pro</div>
        <div className="toolbar">
           <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="ペン"><Pen size={20} /></button>
           <button className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="消しゴム"><Eraser size={20} /></button>
        </div>
        <div className="stats-card">
          <span><Trophy size={14} inline color="#FFD700" /> スコア: {score}</span>
          <span>問題: {currentIdx + 1} / {problems.length}</span>
        </div>
        <button className="btn" style={{ padding: '8px' }} onClick={() => setShowSettings(true)}><Settings size={18} /></button>
      </header>

      <main className="problem-card">
        <div className="problem-label">{currentProblem.type}</div>
        <div className="problem-text">
           <InlineMath math={currentProblem.question} />
        </div>
      </main>

      <div className="workspace">
        <section className="canvas-container scratchpad-area">
          <div className="section-label" style={{ position: 'absolute', top: 10, left: 15, zIndex: 1, pointerEvents: 'none' }}>
             <PenTool size={14} /> 計算スペース
          </div>
          <MathCanvas 
            ref={scratchpadRef}
            onExport={setScratchpadInput}
            applicationKey={keys.app}
            hmackey={keys.hmac}
            tool={tool}
            penWidth={0.3}
          />
        </section>

        <section className="canvas-container answer-area">
          <div className="section-label" style={{ position: 'absolute', top: 8, left: 12, zIndex: 1, pointerEvents: 'none' }}>
             <CheckCircle2 size={14} /> 解答欄
          </div>
          <MathCanvas 
            ref={answerAreaRef}
            onExport={setAnswerInput}
            applicationKey={keys.app}
            hmackey={keys.hmac}
            tool={tool}
            penWidth={0.3}
            theme={{ color: '#00FF99' }}
          />
          {showSolution && (
            <div style={{ position: 'absolute', bottom: 10, right: 15, background: 'rgba(0,100,50,0.8)', padding: '5px 15px', borderRadius: '8px', border: '1px solid #00FF99', color: '#00FF99', fontWeight: 'bold', zIndex: 20 }}>
              正解: {currentProblem.answer}
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <button className="btn btn-clear" onClick={handleClear}><Trash2 size={20} /> 全クリア</button>
        <div className="stats-card" style={{ flex: 1, justifyContent: 'center', fontSize: '18px', border: '1px dashed var(--accent-color)', minWidth: '200px', height: '50px' }}>
           {answerInput ? <InlineMath math={answerInput} /> : <span style={{ opacity: 0.5, fontSize: '14px' }}>解答プレビュー</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={toggleSolution}><Eye size={20} /> {showSolution ? '解答を隠す' : '答えをみる'}</button>
          <button className="btn btn-primary" onClick={checkAnswer} disabled={!answerInput || isCorrect === true}><CheckCircle2 size={20} /> 答え合わせ</button>
          <button className="btn" onClick={nextProblem} style={{ background: 'var(--glass-bg-accent)' }}><ChevronRight size={20} /> 次の問題</button>
        </div>
      </footer>

      {(!keys.app || !keys.hmac) && (
        <div className="overlay" style={{ zIndex: 2000 }}>
          <div className="modal">
            <Settings size={50} color="var(--accent-color)" style={{ marginBottom: 15 }} />
            <h2>初期設定が必要です</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '15px 0' }}>MyScript Cloud の API キーを設定してください。</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSettings(true)}>APIキーを設定する</button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" style={{ zIndex: 3000 }}>
          <div className="modal">
            <h3>APIキー設定</h3>
            <form onSubmit={saveKeys} style={{ marginTop: 20 }}>
              <div style={{ textAlign: 'left', marginBottom: 15 }}>
                <label>Application Key</label>
                <input type="text" value={keys.app} onChange={e => setKeys({...keys, app: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: 5, borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#1c1c21', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left', marginBottom: 20 }}>
                <label>HMAC Key</label>
                <input type="text" value={keys.hmac} onChange={e => setKeys({...keys, hmac: e.target.value})} style={{ width: '100%', padding: '10px', marginTop: 5, borderRadius: '8px', border: '1px solid var(--glass-border)', background: '#1c1c21', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowSettings(false)}>閉じる</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>適用</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overlay" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 4000 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="modal" style={{ border: `2px solid ${isCorrect ? 'var(--success-color)' : 'var(--error-color)'}` }}>
              {isCorrect ? (
                <>
                  <CheckCircle2 size={80} color="var(--success-color)" style={{ margin: '0 auto' }} />
                  <h1 style={{ color: 'var(--success-color)', marginTop: 20 }}>正解です！</h1>
                  <button className="btn btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={nextProblem}>次の問題へ</button>
                </>
              ) : (
                <>
                  <XCircle size={80} color="var(--error-color)" style={{ margin: '0 auto' }} />
                  <h1 style={{ color: 'var(--error-color)', marginTop: 20 }}>残念、不正解です</h1>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsCorrect(null)}>やり直す</button>
                    <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsCorrect(null); toggleSolution(); }}>解答をみる</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
