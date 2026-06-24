import { invoke } from "@tauri-apps/api/core";

export interface SearchMatch {
  path: string;
  rel_path: string;
  line: number;
  column: number;
  preview: string;
}

export async function searchInFiles(
  root: string,
  query: string,
  caseSensitive: boolean,
  maxResults = 500
): Promise<SearchMatch[]> {
  if (!root || !query.trim()) return [];
  return await invoke<SearchMatch[]>("search_in_files", {
    root,
    query,
    caseSensitive,
    maxResults,
  });
}
