import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUEST_TIMEOUT_MS = 15_000;

export async function readResource(urlString: string): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`invalid URL: ${urlString}`);
  }

  if (url.protocol === 'file:') {
    return fs.promises.readFile(fileURLToPath(url));
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`unsupported URL protocol: ${url.protocol}`);
  }

  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`request returned HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
