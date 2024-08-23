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

  let colorScheme = '';
  if (tagName === 'html') {
    colorScheme =
      element.style.colorScheme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  const attributes: string[] = [''];
  for (const _attr of element.getAttributeNames()) {
    const attr = _attr.toLowerCase();
    // if (attr === 'style') continue;
    if (attr.startsWith('on')) continue;

    let value = element.getAttribute(_attr);

    if (attr === 'style' && colorScheme) {
      value += `;color-scheme:${colorScheme}`;
      colorScheme = '';
    }

    if (tagName === 'img' && attr === 'src') {
      value = await inlineImageSrc(value);
    }

    attributes.push(`${_attr}="${value.replaceAll('"', '\\"')}"`);
  }

  if (colorScheme) {
    attributes.push(`style="color-scheme:${colorScheme}"`);
  }

  // const style = captureStyle(element);
  // attributes.push(`style="${style.replaceAll('"', '\\"')}"`);

  let children = (
    await Promise.all(Array.from(element.childNodes).map(captureHelper))
  ).join('');

  if (tagName === 'head') {
    const colors = matchMedia('(prefers-color-scheme: dark)').matches
      ? 'background-color: black; color: white'
      : 'background-color: white; color: black';

    children = `<style>:where(:root){${colors}}</style>${children}`;
  } else if (tagName === 'style') {
    children = freezeMediaQueries(children);
  }

  return `<${tagName}${attributes.join(' ')}>${children}</${tagName}>`;
}

async function captureStylesheet(element: HTMLLinkElement): Promise<string> {
  try {
    const res = await fetch(element.getAttribute('href'));
    const text = await res.text();
    return `<style>${freezeMediaQueries(text)
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')}</style>`;
  } catch (e) {
    console.log(e);
  }
  return '';
}

const MEDIA_TRUE = '@media(min-width:0)';
const MEDIA_FALSE = '@media(max-width:0)';

function freezeMediaQueries(css: string): string {
  // Replace media queries to always or never match depending on whether they match
  // while creating the snapshot
  return css.replace(/@media\s*(\(.*?\))/gim, (_, query) => {
    // TODO: handle complex media queries (e.g. and/or)
    const { matches } = matchMedia(query);
    // console.log({ query, matches });
    if (matches) {
      return MEDIA_TRUE;
    }
    return MEDIA_FALSE;
  });
}

async function inlineImageSrc(src: string): Promise<string> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const data = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.addEventListener('error', () => reject());
      reader.readAsDataURL(blob);
    });
    return await data;
  } catch (e) {
    console.log(e);
  }
  return src;
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
