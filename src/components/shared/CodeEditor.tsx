import { useRef, useEffect, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: Extension;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const lightTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'oklch(0.967 0.001 286.38)' },
  '.cm-activeLine': { backgroundColor: 'oklch(0.967 0.001 286.38 / 0.5)' },
});

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  placeholder = '',
  className,
  minHeight = '300px',
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const getTheme = useCallback(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return oneDark;
    }
    return lightTheme;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, ...searchKeymap, indentWithTab]),
      EditorView.lineWrapping,
      EditorView.theme({ '&': { minHeight } }),
      getTheme(),
    ];

    if (language) extensions.push(language);
    if (readOnly) extensions.push(EditorState.readOnly.of(true));
    if (placeholder) {
      extensions.push(
        EditorView.contentAttributes.of({ 'aria-placeholder': placeholder }),
      );
    }

    if (!readOnly) {
      extensions.push(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      );
    }

    const state = EditorState.create({ doc: value, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, readOnly, getTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'border border-border rounded-lg overflow-hidden text-sm [&_.cm-editor]:outline-none',
        className,
      )}
    />
  );
}
