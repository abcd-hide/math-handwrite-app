import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

const MathCanvas = forwardRef(({ onExport, applicationKey, hmackey, tool = 'pen', theme = {}, penWidth = 0.7 }, ref) => {
  const nodeRef = useRef(null);
  const editorRef = useRef(null);
  const onExportRef = useRef(onExport);
  const [status, setStatus] = useState('initializing');

  // Always keep a ref to the latest export handler to avoid closure traps
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

  const initEditor = (iink) => {
    if (!nodeRef.current) return;
    
    try {
      const editor = iink.register(nodeRef.current, {
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
            maximumRatio: 1, // Prevent auto-scaling on iPad
            penStyle: {
              color: theme.color || '#FFFFFF',
              '-myscript-pen-width': 0.4
            }
          }
        },
        theme: getAppliedTheme()
      });

      editorRef.current = editor;
      setStatus('ready');

      const handleExport = (event) => {
        const exports = event.detail.exports;
        if (exports && exports['application/x-latex']) {
          if (onExportRef.current) {
            onExportRef.current(exports['application/x-latex']);
          }
        }
      };
      nodeRef.current.addEventListener('exported', handleExport);

      window.addEventListener('resize', () => editor.resize());

      // Initial theme & pen style enforcement
      setTimeout(() => {
        if (editorRef.current) {
          const color = theme.color || '#FFFFFF';
          editorRef.current.penStyle = `color: ${color}; -myscript-pen-width: ${penWidth}; -myscript-pen-fill-style: none;`;
          editorRef.current.theme = getAppliedTheme();
        }
      }, 500);
    } catch (err) {
      console.error('iink registration failed', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!applicationKey || !hmackey) {
      setStatus('waiting-keys');
      return;
    }

    let checkCount = 0;
    const interval = setInterval(() => {
      if (window.iink) {
        clearInterval(interval);
        initEditor(window.iink);
      } else if (checkCount > 10) {
        clearInterval(interval);
        setStatus('lib-error');
      }
      checkCount++;
    }, 500);

    return () => {
      clearInterval(interval);
      if (editorRef.current) {
        editorRef.current.close();
      }
    };
  }, [applicationKey, hmackey]);

  useEffect(() => {
    if (editorRef.current) {
      const color = theme.color || '#FFFFFF';
      editorRef.current.tool = tool;
      editorRef.current.penStyle = `color: ${color}; -myscript-pen-width: ${penWidth}; -myscript-pen-fill-style: none;`;
      editorRef.current.theme = getAppliedTheme();
    }
  }, [tool, penWidth]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div 
        ref={nodeRef} 
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      />
      {status !== 'ready' && (
        <div style={{ position: 'absolute', top: 5, right: 5, fontSize: '10px', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }}>
          Status: {status}
        </div>
      )}
    </div>
  );
});

export default MathCanvas;
