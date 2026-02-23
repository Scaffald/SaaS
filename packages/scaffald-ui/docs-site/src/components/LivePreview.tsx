import React, { useState } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview as ReactLivePreview } from 'react-live';
import { themes as prismThemes } from 'prism-react-renderer';
import * as ScaffaldUI from '@scaffald/ui';

interface LivePreviewProps {
  code: string;
  noInline?: boolean;
}

const scope = {
  ...ScaffaldUI,
  React,
};

export default function LivePreview({ code, noInline = false }: LivePreviewProps): React.ReactElement {
  const [isDark, setIsDark] = useState(false);

  return (
    <div style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ifm-color-emphasis-100)', borderBottom: '1px solid var(--ifm-color-emphasis-300)' }}>
        <span style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Preview</span>
        <button
          type="button"
          onClick={() => setIsDark(d => !d)}
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--ifm-color-emphasis-300)', background: 'transparent', cursor: 'pointer', color: 'var(--ifm-font-color-base)' }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <LiveProvider code={code} scope={scope} noInline={noInline} theme={prismThemes.github}>
        <div style={{ padding: 24, background: isDark ? '#1a1a2e' : '#fafafa', minHeight: 80 }}>
          <ScaffaldUI.ThemeProvider initialTheme={isDark ? 'dark' : 'light'}>
            <ReactLivePreview />
          </ScaffaldUI.ThemeProvider>
        </div>
        <LiveError style={{ color: '#e53e3e', background: '#fff5f5', padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', margin: 0 }} />
        <LiveEditor style={{ fontSize: 13 }} />
      </LiveProvider>
    </div>
  );
}
