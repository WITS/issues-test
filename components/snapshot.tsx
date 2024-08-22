'use client';

import { useState, useEffect } from 'react';

async function capture(): Promise<string> {
  return `<!DOCTYPE html>${await captureHelper(document.documentElement)}`;
}

const HIDDEN_ELEMENTS = new Set(['noscript', 'script', 'link']);

async function captureHelper(element: HTMLElement | Node): Promise<string> {
  if (!('tagName' in element)) {
    return element.textContent;
  }

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'link' && element.getAttribute('rel') === 'stylesheet') {
    return captureStylesheet(element as HTMLLinkElement);
  }

  if (HIDDEN_ELEMENTS.has(tagName)) return '';

  const attributes: string[] = [''];
  for (const _attr of element.getAttributeNames()) {
    const attr = _attr.toLowerCase();
    // if (attr === 'style') continue;
    if (attr.startsWith('on')) continue;

    const value = element.getAttribute(_attr);
    attributes.push(`${_attr}="${value.replaceAll('"', '\\"')}"`);
  }

  // const style = captureStyle(element);
  // attributes.push(`style="${style.replaceAll('"', '\\"')}"`);

  const children = await Promise.all(
    Array.from(element.childNodes).map(captureHelper),
  );

  return `<${tagName}${attributes.join(' ')}>${children.join('')}</${tagName}>`;
}

async function captureStylesheet(element: HTMLLinkElement): Promise<string> {
  try {
    const res = await fetch(element.getAttribute('href'));
    const text = await res.text();
    return `<style>${text
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')}</style>`;
  } catch (e) {
    console.log(e);
  }
  return '';
}

export function SnapshotCapture() {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isCapturing) return;

    (async () => {
      setSnapshot(await capture());
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
      setIsCapturing(false);
    })();
  }, [isCapturing]);

  return (
    <div
      className="w-full max-w-md mx-auto"
      style={isCapturing ? { display: 'none' } : undefined}
    >
      <header>
        <h1>Snapshot Capture</h1>
      </header>
      <main>
        <div className="flex flex-col items-center space-y-4">
          {snapshot ? (
            // <pre>{snapshot}</pre>
            <div
              style={{
                containerName: 'snapshot',
                containerType: 'inline-size',
                maxWidth: '60vw',
                aspectRatio: `${width} / ${height}`,
              }}
            >
              <iframe
                srcDoc={snapshot}
                style={{
                  width,
                  height,
                  // transform: `scale(calc(100cqw / ${width}px))`,
                  transform: 'scale(0.5)',
                  border: '1px solid gray',
                }}
              />
            </div>
          ) : (
            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                {isCapturing ? 'Capturing...' : 'No image captured'}
              </p>
            </div>
          )}
          <button
            onClick={() => setIsCapturing(true)}
            disabled={isCapturing}
            className="w-full"
            type="button"
          >
            {/* <Camera className="w-4 h-4 mr-2" /> */}
            {isCapturing ? 'Capturing...' : 'Capture Tab'}
          </button>
        </div>
      </main>
    </div>
  );
}
