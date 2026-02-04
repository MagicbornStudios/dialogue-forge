'use client';

export default function OpenCodePage() {
  // In dev mode, use the OpenCode UI dev server
  // In prod mode, use static assets from public/vendor/opencode
  const devUrl = process.env.NEXT_PUBLIC_OPENCODE_UI_DEV_URL;
  const prodUrl = '/vendor/opencode/index.html';

  const src = devUrl && devUrl.length > 0 ? devUrl : prodUrl;

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <iframe
        src={src}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: '0',
          display: 'block'
        }}
        allow="clipboard-read; clipboard-write"
        title="OpenCode UI"
      />
    </div>
  );
}
