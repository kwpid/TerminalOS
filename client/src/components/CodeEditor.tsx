import { useRef, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function CodeEditor({ value, onChange, language, placeholder, className, "data-testid": testId }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoClosePairs: Record<string, string> = {
    '(': ')',
    '{': '}',
    '[': ']',
    '"': '"',
    "'": "'",
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const currentValue = value;

    if (e.key in autoClosePairs) {
      e.preventDefault();
      const closingChar = autoClosePairs[e.key];
      const selectedText = currentValue.substring(selectionStart, selectionEnd);
      
      const newValue = 
        currentValue.substring(0, selectionStart) +
        e.key +
        selectedText +
        closingChar +
        currentValue.substring(selectionEnd);
      
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      }, 0);
    }
    else if (e.key === 'Backspace') {
      const charBefore = currentValue[selectionStart - 1];
      const charAfter = currentValue[selectionStart];
      
      if (selectionStart === selectionEnd && charBefore && charAfter) {
        if (autoClosePairs[charBefore] === charAfter) {
          e.preventDefault();
          const newValue = 
            currentValue.substring(0, selectionStart - 1) +
            currentValue.substring(selectionStart + 1);
          
          onChange(newValue);
          
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
          }, 0);
        }
      }
    }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = 
        currentValue.substring(0, selectionStart) +
        '  ' +
        currentValue.substring(selectionEnd);
      
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
    }
    else if (e.key === 'Enter') {
      const lines = currentValue.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      
      const charBefore = currentValue[selectionStart - 1];
      const charAfter = currentValue[selectionStart];
      
      if (charBefore === '{' && (autoClosePairs[charBefore] === charAfter || !charAfter || charAfter === '\n')) {
        e.preventDefault();
        const extraIndent = '  ';
        const newValue = 
          currentValue.substring(0, selectionStart) +
          '\n' + indent + extraIndent +
          '\n' + indent +
          currentValue.substring(selectionStart);
        
        onChange(newValue);
        
        setTimeout(() => {
          const newPosition = selectionStart + 1 + indent.length + extraIndent.length;
          textarea.selectionStart = textarea.selectionEnd = newPosition;
        }, 0);
      } else if (charBefore === '{') {
        e.preventDefault();
        const extraIndent = '  ';
        const newValue = 
          currentValue.substring(0, selectionStart) +
          '\n' + indent + extraIndent +
          currentValue.substring(selectionStart);
        
        onChange(newValue);
        
        setTimeout(() => {
          const newPosition = selectionStart + 1 + indent.length + extraIndent.length;
          textarea.selectionStart = textarea.selectionEnd = newPosition;
        }, 0);
      }
    }
  };

  const getSyntaxHighlightedClass = () => {
    if (language === 'fluxo') {
      return 'fluxo-syntax';
    }
    return '';
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className={`w-full h-full font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 ${getSyntaxHighlightedClass()} ${className || ''}`}
      placeholder={placeholder}
      data-testid={testId}
      spellCheck={false}
    />
  );
}
