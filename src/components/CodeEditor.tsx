import { useEffect, useMemo, useRef } from 'react'
import Editor from '@monaco-editor/react'
import type { editor as MonacoEditorNamespace } from 'monaco-editor'

type CodeEditorProps = {
  code: string
  focusLine: number | null
  onChange: (value: string) => void
}

export function CodeEditor({ code, focusLine, onChange }: CodeEditorProps) {
  const editorRef = useRef<MonacoEditorNamespace.IStandaloneCodeEditor | null>(null)
  const decorationIdsRef = useRef<string[]>([])

  const lineCount = useMemo(() => code.split('\n').length, [code])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    if (!focusLine) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [])
      return
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range: {
          startLineNumber: focusLine,
          startColumn: 1,
          endLineNumber: focusLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'monaco-focus-line',
          glyphMarginClassName: 'monaco-focus-glyph',
        },
      },
    ])

    editor.revealLineInCenter(focusLine)
  }, [focusLine, code])

  return (
    <div className="code-workspace">
      <div className="editor-panel">
        <div className="editor-head">
          <h3>Code Playground</h3>
          <p>Monaco editor with live focus highlight. Edit and press Rebuild.</p>
        </div>

        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => onChange(value ?? '')}
          onMount={(editor) => {
            editorRef.current = editor
          }}
          options={{
            fontFamily: 'var(--font-code)',
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbersMinChars: 3,
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            glyphMargin: true,
            automaticLayout: true,
          }}
          aria-label="JavaScript code editor"
        />
      </div>

      <div className="focus-panel">
        <div className="editor-head">
          <h3>Execution Focus</h3>
          <p>
            {focusLine
              ? `Currently highlighting line ${focusLine} of ${lineCount}.`
              : 'No active line for this step.'}
          </p>
        </div>
        <div className="focus-summary">
          <p>
            Focused line: <strong>{focusLine ?? 'none'}</strong>
          </p>
          <p>
            Total lines: <strong>{lineCount}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
