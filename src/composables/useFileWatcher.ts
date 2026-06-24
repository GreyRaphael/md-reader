import { onUnmounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export type FileChangeHandler = (paths: string[]) => void;

export function useFileWatcher() {
  const watching = ref<string>("");
  let unlisten: UnlistenFn | null = null;

  async function start(root: string, handler: FileChangeHandler) {
    await stop();
    await invoke("start_watch", { root });
    unlisten = await listen<string[]>("md-reader://file-changed", (event) => {
      handler(event.payload);
    });
    watching.value = root;
  }

  async function stop() {
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
    if (watching.value) {
      try {
        await invoke("stop_watch");
      } catch {
        /* ignore */
      }
      watching.value = "";
    }
  }

  onUnmounted(() => {
    void stop();
  });

  return { watching, start, stop };
}
