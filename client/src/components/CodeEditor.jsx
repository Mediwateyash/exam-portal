import React, { useState } from 'react';
import { Code, Copy, Check, RotateCcw } from 'lucide-react';

const LANGUAGE_TEMPLATES = {
  javascript: `// JavaScript Solution\nfunction solution() {\n  // Write your code here\n  \n}\n`,
  python: `# Python Solution\ndef solution():\n    # Write your code here\n    pass\n`,
  cpp: `// C++ Solution\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n`,
  java: `// Java Solution\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n`,
  sql: `-- SQL Query Solution\nSELECT * FROM table_name;\n`
};

export default function CodeEditor({
  value = '',
  onChange,
  language = 'javascript',
  onLanguageChange,
  readOnly = false,
  minHeight = '300px',
  isExamMode = false
}) {
  const [copied, setCopied] = useState(false);

  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Reset code editor to default template? Your current code will be lost.')) {
      const template = LANGUAGE_TEMPLATES[language] || '';
      onChange(template);
    }
  };

  const lineCount = Math.max(1, (value || '').split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="code-editor-wrapper" style={{ minHeight }}>
      {/* Editor Top Bar */}
      <div className="code-editor-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
            <Code size={15} />
            <span>Code Workspace</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onLanguageChange && !readOnly && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="code-editor-lang-select"
            >
              <option value="javascript">JavaScript (Node)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
              <option value="java">Java 17</option>
              <option value="sql">SQL</option>
            </select>
          )}

          {!readOnly && onLanguageChange && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#1e293b',
                color: '#94a3b8',
                borderColor: '#475569',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem'
              }}
              title="Reset code"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}

          {!isExamMode && (
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#1e293b',
                color: '#94a3b8',
                borderColor: '#475569',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem'
              }}
              title="Copy code"
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div style={{ display: 'flex', minHeight: '260px', background: '#0f172a' }}>
        <div style={{
          padding: '1rem 0.6rem 1rem 0.75rem',
          background: '#0b1120',
          color: '#475569',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          textAlign: 'right',
          userSelect: 'none',
          borderRight: '1px solid #1e293b',
          minWidth: '40px'
        }}>
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            if (isExamMode) {
              e.preventDefault();
            }
          }}
          onCopy={(e) => {
            if (isExamMode) {
              e.preventDefault();
            }
          }}
          onCut={(e) => {
            if (isExamMode) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => {
            if (isExamMode) {
              e.preventDefault();
            }
          }}
          readOnly={readOnly}
          placeholder="// Type your code solution here..."
          className="code-textarea"
          style={{
            flex: 1,
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            padding: '1rem',
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontSize: '0.9375rem',
            lineHeight: '1.5'
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
