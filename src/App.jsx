import React, { useState, useEffect, useRef } from 'react';
import { Trash2, CheckCircle2, XCircle, Trophy, Settings, PenTool, Eraser, Pen, Eye, ChevronRight, Play, LayoutList, RotateCcw, Circle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as math from 'mathjs';
import { InlineMath, BlockMath } from 'react-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import MathCanvas from './components/MathCanvas';
import './index.css';
import { generateProblem } from './utils/problemGenerators';

// Function to clean MyScript LaTeX and make it mathjs-friendly
const cleanMath = (latex) => {
  if (!latex) return "";
  let s = latex;

  // Handle \frac{a}{b} -> ((a)/(b)) with optional spaces and ONE LEVEL of nested braces
  s = s.replace(/\\frac\s*\{((?:[^{}]|\{[^{}]*\})*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, '(($1)/($2))');
  
  // Handle power notation with braces ^{n} -> ^(n)
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');

  // LaTeX symbols to mathjs
  s = s.replace(/\\left/g, '').replace(/\\right/g, '');
  s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
  s = s.replace(/\\log_\{?([^}]*)\}?\(?([^)]*)\)?/g, 'log($2, $1)'); // simple log support
  
  // Braces/Brackets to parens
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\[/g, '(').replace(/\]/g, ')');
  
  s = s.replace(/\\ /g, ''); // Remove latex spaces
  s = s.replace(/\\/g, ''); // Remove remaining backslashes
  s = s.replace(/\s+/g, ''); // Remove all other spaces
  
  // Implicit multiplication: 
  // 1. Digit/Variable before Parenthesis: 2( -> 2*(, n( -> n*(
  s = s.replace(/([0-9a-z])(\()/gi, '$1*$2');
  // 2. Parenthesis before Digit/Variable: )2 -> )*2, )n -> )*n
  s = s.replace(/(\))([0-9a-z])/gi, '$1*$2');
  // 3. Digit before Variable: 2n -> 2*n
  s = s.replace(/(\d)([a-z])/gi, '$1*$2');
  // 4. Variable before Variable: xy -> x*y
  s = s.replace(/([a-z])(?=[a-z])/gi, '$1*');
  // 5. Parenthesis before Parenthesis: )( -> )*(
  s = s.replace(/\)\(/g, ')*(');
  
  return s;
};

// Function to normalize LaTeX for better KaTeX rendering
const cleanLatexForDisplay = (latex) => {
  if (!latex) return "";
  let s = latex;
  // Remove MyScript specific artifacts that often break KaTeX rendering
  s = s.replace(/\\left\./g, '').replace(/\\right\./g, '');
  s = s.replace(/\\left/g, '').replace(/\\right/g, ''); 
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  s = s.replace(/\\ /g, ' ');
  return s;
};

// Robust check for mathematical equivalence
const areEquivalent = (inputLatex, targetMath, isEquation = false) => {
  try {
    const cleanedInput = cleanMath(inputLatex);
    const cleanedTarget = cleanMath(targetMath);
    
    if (isEquation) {
      return cleanedInput.replace(/\s/g, '').toLowerCase() === cleanedTarget.replace(/\s/g, '').toLowerCase();
    }

    const node1 = math.parse(cleanedInput);
    const node2 = math.parse(cleanedTarget);
    
    // Variables encountered: x,y,z, a,b,c, p,q,r, s,t,u, i,j,k, m,n
    const testPoints = [
      { x: 1.5, y: 2.7, z: 0.8, a: -2.3, b: 1.2, c: -0.8, p: 0.4, q: -1.2, r: 0.9, s: 1.1, t: -0.5, u: 0.3, i: 1, j: 2, k: 3, m: 4, n: 1 },
      { x: -2.1, y: 0.3, z: -1.5, a: 1.5, b: -2.4, c: 3.1, p: -0.7, q: 0.5, r: -1.1, s: 0.2, t: 1.4, u: -0.9, i: 2, j: 3, k: 4, m: 5, n: 2 },
      { x: 3.2, y: -1.5, z: 2.1, a: 0.5, b: 3.4, c: -1.1, p: 1.2, q: -0.8, r: 0.3, s: -0.4, t: 0.2, u: 1.1, i: 3, j: 4, k: 5, m: 6, n: 3 },
      { i: 4, j: 5, k: 6, m: 7, n: 4 },
      { i: 5, j: 6, k: 7, m: 8, n: 5 },
      { i: 10, j: 11, k: 12, m: 13, n: 10 }
    ];
    
    return testPoints.every(scope => {
      try {
        const v1 = node1.evaluate(scope);
        const v2 = node2.evaluate(scope);
        
        // Use mathjs utilities for more robust equality check
        if (math.equal(v1, v2)) return true;
        
        // Handle floating point differences as fallback
        const diff = math.abs(math.subtract(v1, v2));
        return diff < 1e-7;
      } catch (e) {
        return false;
      }
    });
  } catch (e) {
    console.warn('Math comparison failed', e);
    return false;
  }
};

// Robust KaTeX display component that renders directly to DOM
const KatexDisplay = ({ math, block = false, settings = {} }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          ...settings
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
        containerRef.current.textContent = math;
      }
    }
  }, [math, block, settings]);

  return <span ref={containerRef} />;
};

function App() {
  const [keys, setKeys] = useState({
    app: localStorage.getItem('ms-app-key') || '',
    hmac: localStorage.getItem('ms-hmac-key') || ''
  });

  const [screen, setScreen] = useState('menu'); // 'menu', 'practice', 'test', 'result'
  const [category, setCategory] = useState('factorization');
  const [level, setLevel] = useState(1);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0); 
  const [scratchpadInput, setScratchpadInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  
  // Practice mode feedback
  const [isCorrect, setIsCorrect] = useState(null);
  // Test mode feedback (1 second O/X)
  const [testFeedback, setTestFeedback] = useState(null);
  
  const [score, setScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tool, setTool] = useState('pen'); 
  const [showSolution, setShowSolution] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);

  // Timer states
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Result rankings
  const [rankings, setRankings] = useState([]);
  const [currentRankIndex, setCurrentRankIndex] = useState(-1);

  const scratchpadRef = useRef();
  const answerAreaRef = useRef();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }, []);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (isTimerActive && (screen === 'practice' || screen === 'test')) {
      interval = setInterval(() => {
        setTimeSeconds(prev => {
          if (screen === 'test') {
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, screen]);

  // Check for test timeout
  useEffect(() => {
    if (screen === 'test' && isTimerActive && timeSeconds <= 0) {
      finishTest();
    }
  }, [timeSeconds, screen, isTimerActive]);

  const refreshProblem = (cat, lvl) => {
    const prob = generateProblem(cat, lvl);
    if (prob) {
      setCurrentProblem({
        ...prob,
        check: (input) => areEquivalent(input, prob.answer)
      });
    }
  };

  const startMode = (selectedMode, startLvl = level) => {
    setLevel(startLvl);
    setScreen(selectedMode);
    setScore(0);
    setCurrentIdx(0);
    setIsCorrect(null);
    setShowSolution(false);
    setTestFeedback(null);
    handleClear();
    refreshProblem(category, startLvl);

    if (selectedMode === 'test') {
      let initTime = 60;
      if ([3, 4, 5, 7, 8].includes(startLvl)) initTime = 120;
      if ([6, 9, 10, 11, 12].includes(startLvl)) initTime = 300;
      setTimeSeconds(initTime);
    } else {
      setTimeSeconds(0);
    }
    setIsTimerActive(true);
  };

  const finishTest = () => {
    setIsTimerActive(false);
    
    // Save rankings
    const savedRankings = JSON.parse(localStorage.getItem('math-handwrite-rankings') || '{}');
    const levelRanks = savedRankings[level] || [];
    
    const newEntry = { score, date: new Date().toLocaleDateString() };
    const newRanks = [...levelRanks, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    
    // Find index of current run
    const rankIndex = newRanks.findIndex(r => r === newEntry);
    
    savedRankings[level] = newRanks;
    localStorage.setItem('math-handwrite-rankings', JSON.stringify(savedRankings));
    
    setRankings(newRanks);
    setCurrentRankIndex(rankIndex);
    setScreen('result');
  };

  const checkAnswer = () => {
    if (!answerInput || testFeedback) return;
    const correct = currentProblem.check(answerInput);
    
    if (screen === 'test') {
      if (correct) setScore(s => s + 1);
      setTestFeedback(correct ? 'correct' : 'incorrect');
      setTimeout(() => {
        setTestFeedback(null);
        nextProblem();
      }, 1000);
    } else {
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
    }
  };

  const nextProblem = () => {
    setIsCorrect(null);
    setShowSolution(false);
    handleClear();
    setCurrentIdx(prev => prev + 1);
    refreshProblem(category, level);
  };

  const changeLevel = (newLvl) => {
    if(screen === 'test') return; // Cannot change level during test
    setLevel(newLvl);
    setIsCorrect(null);
    setShowSolution(false);
    handleClear();
    setCurrentIdx(0);
    refreshProblem(category, newLvl);
    if(screen === 'practice') {
      setTimeSeconds(0);
      setIsTimerActive(true);
    }
  };

  const handleClear = () => {
    setAnswerInput('');
    setScratchpadInput('');
    setIsCorrect(null);
    setClearTrigger(prev => prev + 1);
  };

  const toggleSolution = () => setShowSolution(!showSolution);

  const saveKeys = (e) => {
    e.preventDefault();
    localStorage.setItem('ms-app-key', keys.app);
    localStorage.setItem('ms-hmac-key', keys.hmac);
    setShowSettings(false);
    window.location.reload();
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${m}分${s}秒`;
  };

  // Views rendering
  if (!keys.app || !keys.hmac) {
    return (
      <div className="overlay" style={{ zIndex: 2000 }}>
        <div className="modal">
          <Settings size={50} color="var(--accent-color)" style={{ marginBottom: 15 }} />
          <h2>初期設定が必要です</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '15px 0' }}>MyScript Cloud の API キーを設定してください。</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowSettings(true)}>APIキーを設定する</button>
        </div>
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
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>保存</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'menu') {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <header style={{ position: 'absolute', top: 0, width: '100%' }}>
          <div className="logo">MathHandwrite Pro <span style={{ fontSize: '10px', verticalAlign: 'middle', opacity: 0.5 }}>v1.2</span></div>
          <button className="btn" style={{ padding: '8px' }} onClick={() => setShowSettings(true)}><Settings size={18} /></button>
        </header>

        <div className="menu-card modal">
          <h2>モード選択</h2>
          <div style={{ margin: '20px 0', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7 }}>ジャンルを選択:</label>
            <select 
              value={category} 
              onChange={(e) => {
                const newCat = e.target.value;
                setCategory(newCat);
                if (newCat === 'sequence_sum' && level > 8) {
                  setLevel(1);
                }
              }}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '16px', marginBottom: '15px' }}
            >
              <option value="factorization" style={{ background: '#1a1a1e' }}>因数分解</option>
              <option value="sequence_sum" style={{ background: '#1a1a1e' }}>数列の和</option>
            </select>

            <label style={{ display: 'block', marginBottom: '8px', opacity: 0.7 }}>挑戦するレベルを選択:</label>
            <select 
              value={level} 
              onChange={(e) => setLevel(parseInt(e.target.value))}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '16px' }}
            >
              {(category === 'sequence_sum' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((lvl) => (
                <option key={lvl} value={lvl} style={{ background: '#1a1a1e' }}>Level {lvl}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <button className="btn btn-primary" style={{ padding: '15px', justifyContent: 'center', fontSize: '16px' }} onClick={() => startMode('practice')}>
              <PenTool size={20} /> 練習モードでスタート
            </button>
            <button className="btn" style={{ background: 'var(--glass-bg-accent)', padding: '15px', justifyContent: 'center', fontSize: '16px', color: '#ffb74d' }} onClick={() => startMode('test')}>
              <Play size={20} /> テストモードでスタート
            </button>
          </div>
        </div>

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
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div className="app-container" style={{ overflowY: 'auto' }}>
        <header>
          <div className="logo">リザルト (Level {level})</div>
        </header>
        <div className="modal" style={{ margin: '40px auto', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Trophy size={60} color="#FFD700" style={{ marginBottom: '10px' }} />
          <h2 style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>Level {level}</h2>
          <h1 style={{ fontSize: '32px', margin: '10px 0' }}>今回のスコア: {score} 点</h1>
          
          <h2 style={{ marginTop: '30px', alignSelf: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', width: '100%' }}>トップ10 ランキング</h2>
          
          <table className="rankings-table" style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ opacity: 0.7, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                <th style={{ padding: '10px' }}>順位</th>
                <th style={{ padding: '10px' }}>スコア</th>
                <th style={{ padding: '10px' }}>日付</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, idx) => (
                <tr key={idx} className={`rank-row ${idx === currentRankIndex ? 'highlight-rank' : ''}`} style={{ backgroundColor: idx === currentRankIndex ? 'rgba(144,202,249,0.1)' : 'transparent', border: idx === currentRankIndex ? '2px solid var(--accent-color)' : 'none' }}>
                  <td style={{ padding: '10px', fontWeight: idx === currentRankIndex ? 'bold' : 'normal' }}>{idx + 1}</td>
                  <td style={{ padding: '10px', fontWeight: idx === currentRankIndex ? 'bold' : 'normal', color: idx === currentRankIndex ? 'var(--accent-color)' : 'white' }}>{r.score}</td>
                  <td style={{ padding: '10px', fontWeight: idx === currentRankIndex ? 'bold' : 'normal', opacity: 0.8 }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', marginTop: '30px' }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => startMode('test')}>
              <RotateCcw size={20} /> もう一度挑戦
            </button>
            <button className="btn" style={{ justifyContent: 'center', background: 'var(--glass-bg-accent)' }} onClick={() => startMode('practice')}>
              <PenTool size={20} /> 練習モードで練習
            </button>
            <button className="btn" style={{ justifyContent: 'center', gridColumn: 'span 2' }} onClick={() => setScreen('menu')}>
              <LayoutList size={20} /> メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active 'practice' or 'test' views
  if (!currentProblem) return <div className="app-container">Loading...</div>;

  return (
    <div className="app-container">
      <header>
        <div className="logo" onClick={() => setScreen('menu')} style={{ cursor: 'pointer' }}>
          MathHandwrite Pro <span style={{ fontSize: '10px', verticalAlign: 'middle', opacity: 0.5 }}>{screen === 'test' ? 'TEST MODE' : 'PRACTICE'}</span>
        </div>
        <div className="toolbar">
           <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="ペン"><Pen size={20} /></button>
           <button className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="消しゴム"><Eraser size={20} /></button>
        </div>
        <div className="stats-card">
          <span><Trophy size={14} inline color="#FFD700" /> スコア: {score}</span>
          <span style={{ marginLeft: '10px' }}>問題: {currentIdx + 1}</span>
          {screen === 'practice' && <span style={{ marginLeft: '10px', color: '#90caf9' }}>挑戦時間: {formatTime(timeSeconds)}</span>}
          {screen === 'test' && <span style={{ marginLeft: '10px', color: '#ffb74d' }}>残り時間: {formatTime(timeSeconds)}</span>}
        </div>
        
        {screen === 'practice' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <label style={{ fontSize: '12px', opacity: 0.7 }}>レベル:</label>
            <select 
              value={level} 
              onChange={(e) => changeLevel(parseInt(e.target.value))}
              style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {(category === 'sequence_sum' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((lvl) => (
                <option key={lvl} value={lvl} style={{ background: '#1a1a1e' }}>Level {lvl}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,150,0,0.1)', padding: '5px 15px', borderRadius: '20px', border: '1px solid rgba(255,150,0,0.3)', color: '#ffb74d' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Level {level}</label>
          </div>
        )}
        
        <button className="btn" style={{ padding: '8px' }} onClick={() => setScreen('menu')} title="メニューに戻る"><LayoutList size={18} /></button>
      </header>

      <main className="problem-card">
        <div className="problem-label">{currentProblem.type === '和を求めよ' ? '和を求めよ (Ver3)' : currentProblem.type}</div>
        <div className="problem-text">
           <KatexDisplay math={currentProblem.question} block={true} />
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
            clearTrigger={clearTrigger}
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
            clearTrigger={clearTrigger}
          />
          {showSolution && screen === 'practice' && (
            <div style={{ position: 'absolute', bottom: 10, right: 15, background: 'rgba(0,100,50,0.8)', padding: '5px 15px', borderRadius: '8px', border: '1px solid #00FF99', color: '#00FF99', fontWeight: 'bold', zIndex: 20, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>正解:</span> 
              <span className="answer-math-block"><KatexDisplay math={currentProblem.answer} block={true} /></span>
            </div>
          )}
          {/* 1 second O/X feedback overlay for Test Mode inside answer area */}
          <AnimatePresence>
            {testFeedback && (
              <>
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} 
                  style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000, pointerEvents: 'none' }}>
                  {testFeedback === 'correct' ? <Circle size="80vmin" color="var(--success-color)" strokeWidth={1.5} /> : <X size="80vmin" color="var(--error-color)" strokeWidth={1.5} />}
                </motion.div>
                {testFeedback === 'incorrect' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', bottom: '10px', right: '15px', background: 'rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '8px', border: '1px solid var(--error-color)', color: 'white', fontWeight: 'bold', zIndex: 51, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>正解:</span>
                    <span className="answer-math-block"><KatexDisplay math={currentProblem.answer} block={true} /></span>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </section>
      </div>

      <footer className="footer">
        <button className="btn btn-clear" onClick={handleClear}><Trash2 size={20} /> 全クリア</button>
        <div className="stats-card" style={{ flex: 1, justifyContent: 'center', fontSize: '18px', border: '1px dashed var(--accent-color)', minWidth: '200px', height: '50px' }}>
           {answerInput ? <KatexDisplay math={cleanLatexForDisplay(answerInput)} /> : <span style={{ opacity: 0.5, fontSize: '14px' }}>解答プレビュー</span>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {screen === 'practice' && (
            <button className="btn" onClick={toggleSolution}><Eye size={20} /> {showSolution ? '解答を隠す' : '答えをみる'}</button>
          )}
          
          <button className="btn btn-primary" onClick={checkAnswer} disabled={!answerInput || isCorrect === true || testFeedback !== null}>
            <CheckCircle2 size={20} /> 答え合わせ
          </button>
          
          {screen === 'practice' && (
            <button className="btn" onClick={nextProblem} style={{ background: 'var(--glass-bg-accent)' }}><ChevronRight size={20} /> 次の問題</button>
          )}
        </div>
      </footer>

      <AnimatePresence>
        {isCorrect !== null && screen === 'practice' && (
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

      {showSettings && screen !== 'menu' && (
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
    </div>
  );
}

export default App;
