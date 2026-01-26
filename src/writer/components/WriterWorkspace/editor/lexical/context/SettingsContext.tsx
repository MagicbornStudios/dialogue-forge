import React, { createContext, useContext } from 'react';

interface Settings {
  isCodeHighlighted: boolean;
  isCodeShiki: boolean;
  isCollab: boolean;
  useCollabV2: boolean;
  isAutocomplete: boolean;
  isMaxLength: boolean;
  isCharLimit: boolean;
  hasLinkAttributes: boolean;
  hasNestedTables: boolean;
  isCharLimitUtf8: boolean;
  isRichText: boolean;
  showTreeView: boolean;
  showTableOfContents: boolean;
  shouldUseLexicalContextMenu: boolean;
  shouldPreserveNewLinesInMarkdown: boolean;
  tableCellMerge: boolean;
  tableCellBackgroundColor: boolean;
  tableHorizontalScroll: boolean;
  shouldAllowHighlightingWithBrackets: boolean;
  selectionAlwaysOnDisplay: boolean;
  listStrictIndent: boolean;
}

const defaultSettings: Settings = {
  isCodeHighlighted: false,
  isCodeShiki: false,
  isCollab: false,
  useCollabV2: false,
  isAutocomplete: false,
  isMaxLength: false,
  isCharLimit: false,
  hasLinkAttributes: false,
  hasNestedTables: false,
  isCharLimitUtf8: false,
  isRichText: true,
  showTreeView: false,
  showTableOfContents: false,
  shouldUseLexicalContextMenu: false,
  shouldPreserveNewLinesInMarkdown: false,
  tableCellMerge: false,
  tableCellBackgroundColor: false,
  tableHorizontalScroll: false,
  shouldAllowHighlightingWithBrackets: false,
  selectionAlwaysOnDisplay: false,
  listStrictIndent: false,
};

const SettingsContext = createContext<{ settings: Settings }>({ settings: defaultSettings });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  return (
    <SettingsContext.Provider value={{ settings: defaultSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
