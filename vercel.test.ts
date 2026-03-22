import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

type VercelConfig = {
  rewrites?: Array<{
    source: string;
    destination: string;
  }>;
};

const vercelConfig = JSON.parse(
  readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'),
) as VercelConfig;

const spaRewrite = vercelConfig.rewrites?.find(
  (rewrite) => rewrite.destination === '/index.html',
);

describe('vercel SPA rewrite', () => {
  it('keeps client-side routes mapped to index.html', () => {
    expect(spaRewrite).toBeDefined();

    const rewritePattern = toRegex(spaRewrite!.source);

    expect('/').toMatch(rewritePattern);
    expect('/favorites').toMatch(rewritePattern);
    expect('/settings/profile').toMatch(rewritePattern);
  });

  it('does not rewrite Vite dev module requests to index.html', () => {
    expect(spaRewrite).toBeDefined();

    const rewritePattern = toRegex(spaRewrite!.source);

    expect('/src/main.tsx').not.toMatch(rewritePattern);
    expect('/@vite/client').not.toMatch(rewritePattern);
    expect('/@react-refresh').not.toMatch(rewritePattern);
    expect('/node_modules/.vite/deps/react.js').not.toMatch(rewritePattern);
  });
});

function toRegex(source: string) {
  return new RegExp(`^${source}$`);
}
