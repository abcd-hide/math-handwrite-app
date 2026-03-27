import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

const MathCanvas = forwardRef(({ onExport, applicationKey, hmackey, tool = 'pen', theme = {}, penWidth = 0.3, clearTrigger = 0 }, ref) => {
  const nodeRef = useRef(null);
  const editorRef = useRef(null);
  const onExportRef = useRef(onExport);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    onExportRef.current = onExport;
  }, [onExport]);

  const getAppliedTheme = () => ({
    '.ink': {
      color: theme.color || '#FFFFFF',
      '-myscript-pen-width': penWidth,
      '-myscript-pen-fill-style': 'none'
    }
  });

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (editorRef.current) {
        editorRef.current.clear();
      }
    }
  }));

  // Reactive Clear
  useEffect(() => {
    if (clearTrigger > 0 && editorRef.current) {
      console.log("MathCanvas: Reactive Clear");
      editorRef.current.clear();
    }
  }, [clearTrigger]);

  const initEditor = () => {
    if (!nodeRef.current || editorRef.current || !window.iink) return;
    
    try {
      const editor = window.iink.register(nodeRef.current, {
        recognitionParams: {
          type: 'MATH',
          protocol: 'WEBSOCKET',
          apiVersion: 'V4',
          server: {
            scheme: 'https',
            host: 'cloud.myscript.com',
            applicationKey,
            hmacKey: hmackey,
          },
        },
        configuration: {
          rendering: {
            maximumRatio: 1
          }
        },
        theme: getAppliedTheme()
      });

      editorRef.current = editor;
      setStatus('Ready');

      const handleExport = (event) => {
        const exports = event.detail.exports;
        if (exports && exports['application/x-latex']) {
          if (onExportRef.current) {
            onExportRef.current(exports['application/x-latex']);
          }
        }
      };
      nodeRef.current.addEventListener('exported', handleExport);

      window.addEventListener('resize', () => {
        if (editorRef.current) editorRef.current.resize();
      });
      
      setTimeout(() => {
        if (editorRef.current) editorRef.current.resize();
      }, 500);

    } catch (err) {
      console.error('iink registration failed', err);
      setStatus('Error: ' + err.message);
    }
  };

  useEffect(() => {
    if (!applicationKey || !hmackey) {
      setStatus('Missing API Keys');
      return;
    }

    // Wait for window.iink to be available
    const checkIink = setInterval(() => {
      if (window.iink) {
        clearInterval(checkIink);
        initEditor();
      }
    }, 100);

    return () => {
      clearInterval(checkIink);
      if (editorRef.current) {
        editorRef.current.close();
        editorRef.current = null;
      }
    };
  }, [applicationKey, hmackey]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.tool = tool;
      const color = theme.color || '#FFFFFF';
      editorRef.current.penStyle = `color: ${color}; -myscript-pen-width: ${penWidth}; -myscript-pen-fill-style: none;`;
      editorRef.current.theme = getAppliedTheme();
    }
  }, [tool, theme, penWidth]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <div 
        ref={nodeRef} 
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
      {status !== 'Ready' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '10px', color: '#fff', fontSize: '14px', zIndex: 100, border: '1px solid #fff' }}>
           Canvas Status: {status}
        </div>
      )}
    </div>
  );
});

export default MathCanvas;
