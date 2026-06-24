import { ref, Ref } from "vue";

export function useResizable(
  storageKey: string,
  initial: number,
  options: { min?: number; max?: number; inverse?: boolean } = {}
) {
  const min = options.min ?? 160;
  const max = options.max ?? 500;
  const inverse = options.inverse ?? false;
  const width: Ref<number> = ref(
    parseInt(localStorage.getItem(storageKey) || String(initial), 10)
  );

  function startResize(evt: PointerEvent) {
    evt.preventDefault();
    const startX = evt.clientX;
    const startW = width.value;
    function onMove(e: PointerEvent) {
      const dx = inverse ? startX - e.clientX : e.clientX - startX;
      width.value = Math.max(min, Math.min(max, startW + dx));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      localStorage.setItem(storageKey, String(width.value));
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return { width, startResize };
}
