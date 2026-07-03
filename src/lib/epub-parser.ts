'use client';

/**
 * Custom EPUB renderer using JSZip directly.
 * Bypasses epub.js entirely — reads the EPUB archive,
 * parses container.xml + OPF, and renders XHTML chapters.
 */

import * as JSZip from 'jszip';

export interface EpubChapter {
  id: string;
  href: string;
  title: string;
  content: string; // raw XHTML
}

export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
}

export interface ParsedEpub {
  metadata: EpubMetadata;
  chapters: EpubChapter[];
  coverUrl: string | null;
}

/**
 * Parse an EPUB ArrayBuffer into chapters and metadata.
 */
export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Read container.xml to find the OPF path
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) {
    throw new Error('Invalid EPUB: missing META-INF/container.xml');
  }

  const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: no rootfile in container.xml');
  }

  // 2. Parse the OPF (Open Packaging Format)
  const opfContent = await zip.file(opfPath)?.async('text');
  if (!opfContent) {
    throw new Error(`Invalid EPUB: missing ${opfPath}`);
  }

  const opfDoc = new DOMParser().parseFromString(opfContent, 'application/xml');
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

  // 3. Extract metadata
  const metadata: EpubMetadata = {
    title: opfDoc.querySelector('metadata > dc\\:title, metadata > title')?.textContent || 'Unknown',
    author: opfDoc.querySelector('metadata > dc\\:creator, metadata > creator')?.textContent || 'Unknown',
    language: opfDoc.querySelector('metadata > dc\\:language, metadata > language')?.textContent || 'en',
  };

  // 4. Build manifest map (id → href)
  const manifest = new Map<string, string>();
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) manifest.set(id, href);
  });

  // 5. Get spine order
  const spineItems: EpubChapter[] = [];
  const spineEl = opfDoc.querySelector('spine');
  const spineRefs = spineEl?.querySelectorAll('itemref') || [];

  for (let i = 0; i < spineRefs.length; i++) {
    const idref = spineRefs[i].getAttribute('idref');
    if (!idref) continue;

    const href = manifest.get(idref);
    if (!href) continue;

    const fullPath = opfDir + href;
    const content = await zip.file(fullPath)?.async('text');

    if (content) {
      // Try to extract chapter title from the HTML content
      const tempDoc = new DOMParser().parseFromString(content, 'application/xhtml+xml');
      const titleEl = tempDoc.querySelector('h1, h2, h3, title');
      const title = titleEl?.textContent?.trim() || `Chapter ${i + 1}`;

      spineItems.push({
        id: idref,
        href: fullPath,
        title,
        content,
      });
    }
  }

  // 6. Find cover image
  let coverUrl: string | null = null;
  const coverId = opfDoc.querySelector('metadata meta[name="cover"]')?.getAttribute('content');
  if (coverId) {
    const coverHref = manifest.get(coverId);
    if (coverHref) {
      const coverFile = zip.file(opfDir + coverHref);
      if (coverFile) {
        const blob = await coverFile.async('blob');
        coverUrl = URL.createObjectURL(blob);
      }
    }
  }

  return { metadata, chapters: spineItems, coverUrl };
}

/**
 * Resolve a relative path from an EPUB chapter's href.
 * Used for resolving images, CSS, etc. within chapters.
 */
export function resolveEpubPath(basePath: string, relativePath: string): string {
  if (relativePath.startsWith('/')) return relativePath.substring(1);
  const baseDir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
  const resolved = new URL(relativePath, `http://localhost/${baseDir}`).pathname;
  return resolved.substring(1); // remove leading /
}

/**
 * Get a file from the EPUB zip as a blob URL.
 */
export async function getEpubResource(
  zip: JSZip,
  basePath: string,
  relativePath: string
): Promise<string | null> {
  const fullPath = resolveEpubPath(basePath, relativePath);
  const file = zip.file(fullPath);
  if (!file) return null;

  const blob = await file.async('blob');
  return URL.createObjectURL(blob);
}
