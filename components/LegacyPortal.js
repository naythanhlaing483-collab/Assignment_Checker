'use client';

import { useEffect, useRef, useState } from 'react';

function loadScriptFromNode(scriptNode) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    Array.from(scriptNode.attributes).forEach((attribute) => {
      script.setAttribute(attribute.name, attribute.value);
    });

    script.dataset.assignmentPortalAsset = 'true';
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${script.src || 'inline script'}`));

    document.body.appendChild(script);
  });
}

export default function LegacyPortal({ sourceHtml }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(sourceHtml, 'text/html');
    const headNodes = [];
    const appendedScripts = [];
    const originalBodyClassName = document.body.className;
    const originalTitle = document.title;
    let cancelled = false;

    async function mountPortal() {
      try {
        const parsedBody = parsedDocument.body;
        const parsedHead = parsedDocument.head;

        if (!parsedBody || !parsedHead) {
          throw new Error('Unable to parse the legacy portal document.');
        }

        document.title = parsedDocument.title || originalTitle;
        document.body.className = parsedBody.className || '';

        Array.from(parsedHead.children).forEach((node) => {
          if (node.tagName === 'SCRIPT') {
            return;
          }

          const clonedNode = document.importNode(node, true);
          clonedNode.dataset.assignmentPortalAsset = 'true';
          document.head.appendChild(clonedNode);
          headNodes.push(clonedNode);
        });

        const bodyClone = parsedBody.cloneNode(true);
        const inlineScripts = Array.from(bodyClone.querySelectorAll('script'));
        inlineScripts.forEach((scriptNode) => scriptNode.remove());
        containerRef.current.innerHTML = bodyClone.innerHTML;

        const externalScripts = Array.from(parsedHead.querySelectorAll('script[src]'));
        for (const scriptNode of externalScripts) {
          if (cancelled) {
            return;
          }

          const loadedScript = await loadScriptFromNode(scriptNode);
          appendedScripts.push(loadedScript);
        }

        for (const scriptNode of inlineScripts) {
          if (cancelled) {
            return;
          }

          const inlineScript = document.createElement('script');
          inlineScript.dataset.assignmentPortalAsset = 'true';
          inlineScript.text = scriptNode.textContent || '';
          document.body.appendChild(inlineScript);
          appendedScripts.push(inlineScript);
        }
      } catch (mountError) {
        setError(mountError instanceof Error ? mountError.message : 'Failed to load the portal.');
      }
    }

    mountPortal();

    return () => {
      cancelled = true;
      containerRef.current.innerHTML = '';
      document.body.className = originalBodyClassName;
      document.title = originalTitle;
      headNodes.forEach((node) => node.remove());
      appendedScripts.forEach((script) => script.remove());
    };
  }, [sourceHtml]);

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Portal Load Failed</h1>
        <p>{error}</p>
      </main>
    );
  }

  return <div ref={containerRef} suppressHydrationWarning />;
}
