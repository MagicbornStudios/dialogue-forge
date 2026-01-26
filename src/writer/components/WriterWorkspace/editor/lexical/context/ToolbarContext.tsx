import { useState, useCallback } from 'react';

export const blockTypeToBlockName = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  bullet: 'Bulleted List',
  number: 'Numbered List',
  check: 'Check List',
  quote: 'Quote',
  code: 'Code Block',
};

interface ToolbarState {
  blockType: keyof typeof blockTypeToBlockName;
  fontSize: string;
  fontFamily: string;
  fontColor: string;
  bgColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isHighlight: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isRTL: boolean;
  codeLanguage: string;
  codeTheme: string;
  elementFormat: string;
  isLink: boolean;
  rootType: 'root' | 'table';
  isImageCaption: boolean;
  isLowercase: boolean;
  isUppercase: boolean;
  isCapitalize: boolean;
}

const defaultToolbarState: ToolbarState = {
  blockType: 'paragraph',
  fontSize: '15px',
  fontFamily: 'Arial',
  fontColor: '#000',
  bgColor: '#fff',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  isCode: false,
  isSubscript: false,
  isSuperscript: false,
  isHighlight: false,
  canUndo: false,
  canRedo: false,
  isRTL: false,
  codeLanguage: '',
  codeTheme: '',
  elementFormat: 'left',
  isLink: false,
  rootType: 'root',
  isImageCaption: false,
  isLowercase: false,
  isUppercase: false,
  isCapitalize: false,
};

export function useToolbarState() {
  const [toolbarState, setToolbarState] = useState<ToolbarState>(defaultToolbarState);

  const updateToolbarState = useCallback(<K extends keyof ToolbarState>(
    key: K,
    value: ToolbarState[K]
  ) => {
    setToolbarState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    toolbarState,
    updateToolbarState,
  };
}
