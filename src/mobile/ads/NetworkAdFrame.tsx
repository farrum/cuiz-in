import { useMemo } from 'react';

interface NetworkAdFrameProps {
  /** Adsterra "key" for this placement. */
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Renders an Adsterra (highperformanceformat.com) ad inside an isolated
 * sandboxed iframe. These ads rely on a GLOBAL `atOptions` variable that
 * invoke.js reads at runtime, so each placement MUST live in its own window
 * scope — otherwise multiple slots overwrite the same global and only one
 * renders. The iframe `srcdoc` gives every slot a fresh scope.
 */
export function NetworkAdFrame({ adKey, width, height, className }: NetworkAdFrameProps) {
  const srcDoc = useMemo(
    () => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center;}</style></head><body>
<script type="text/javascript">
  atOptions = {
    'key' : '${adKey}',
    'format' : 'iframe',
    'height' : ${height},
    'width' : ${width},
    'params' : {}
  };
<\/script>
<script type="text/javascript" src="https://www.highperformanceformat.com/${adKey}/invoke.js"><\/script>
</body></html>`,
    [adKey, width, height],
  );

  return (
    <iframe
      title="Sponsored ad"
      srcDoc={srcDoc}
      width={width}
      height={height}
      scrolling="no"
      frameBorder={0}
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      style={{ border: 0, maxWidth: '100%', display: 'block', margin: '0 auto' }}
      className={className}
    />
  );
}

export default NetworkAdFrame;