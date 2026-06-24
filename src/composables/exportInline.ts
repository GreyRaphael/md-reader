import { readFile } from "@tauri-apps/plugin-fs";

const TAURI_ASSET_PATTERNS = [
  /^https?:\/\/asset\.localhost\//i,
  /^asset:\/\/localhost\//i,
  /^https?:\/\/[^/]+\.localhost\/+/i,
];

function isExternal(src: string): boolean {
  return /^(https?:|data:|blob:|mailto:|tel:)/i.test(src);
}

function decodeTauriAsset(src: string): string | null {
  for (const re of TAURI_ASSET_PATTERNS) {
    if (re.test(src)) {
      const rest = src.replace(re, "");
      try {
        return decodeURIComponent(rest);
      } catch {
        return rest;
      }
    }
  }
  return null;
}

function extFromPath(p: string): string {
  const m = p.match(/\.([A-Za-z0-9]+)(?:\?|#|$)/);
  return m ? m[1].toLowerCase() : "";
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "svg": return "image/svg+xml";
    case "webp": return "image/webp";
    case "bmp": return "image/bmp";
    default: return "application/octet-stream";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk))
    );
  }
  return btoa(bin);
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    const ct = r.headers.get("content-type") || mimeFromExt(extFromPath(url));
    return `data:${ct};base64,${bytesToBase64(buf)}`;
  } catch {
    return null;
  }
}

async function readLocalAsDataUrl(absPath: string): Promise<string | null> {
  try {
    const bytes = await readFile(absPath);
    const u8 =
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as any);
    const ext = extFromPath(absPath);
    return `data:${mimeFromExt(ext)};base64,${bytesToBase64(u8)}`;
  } catch {
    return null;
  }
}

export async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      const local = decodeTauriAsset(src);
      if (local) {
        const d = await readLocalAsDataUrl(local);
        if (d) img.setAttribute("src", d);
        return;
      }
      if (isExternal(src)) {
        const d = await fetchAsDataUrl(src);
        if (d) img.setAttribute("src", d);
      }
    })
  );
}

export function ensureSvgNamespace(root: HTMLElement): void {
  root.querySelectorAll<SVGSVGElement>("svg").forEach((svg) => {
    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
  });
}
