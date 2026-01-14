export const writerTheme = {
  paragraph: 'leading-relaxed',
  quote: 'border-l-2 border-df-node-border pl-4 italic text-df-text-secondary',
  heading: {
    h1: 'text-2xl font-semibold',
    h2: 'text-xl font-semibold',
    h3: 'text-lg font-semibold',
  },
  list: {
    nested: {
      listitem: 'ml-4',
    },
    ol: 'list-decimal pl-6',
    ul: 'list-disc pl-6',
    listitem: 'mb-1',
  },
  link: 'text-df-text-primary underline decoration-df-text-tertiary',
  text: {
    bold: 'font-semibold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono text-xs rounded bg-df-control-bg px-1 py-0.5',
  },
  code: 'rounded-md border border-df-control-border bg-df-control-bg px-3 py-2 font-mono text-xs',
};
