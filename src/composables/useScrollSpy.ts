import { ref, Ref } from "vue";

export function useScrollSpy(
  containerRef: Ref<HTMLElement | null>,
  bodyRef: Ref<HTMLElement | null>
) {
  const activeId = ref<string>("");
  let raf = 0;

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const container = containerRef.value;
      const body = bodyRef.value;
      if (!container || !body) return;
      const containerTop = container.getBoundingClientRect().top;
      const hs = body.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, h5, h6"
      );
      let current = "";
      for (const h of Array.from(hs)) {
        const rect = h.getBoundingClientRect();
        if (rect.top - containerTop < 80) {
          current = h.getAttribute("id") || "";
        } else {
          break;
        }
      }
      activeId.value = current;
    });
  }

  function jumpTo(id: string) {
    const body = bodyRef.value;
    const container = containerRef.value;
    if (!body || !container) return;
    const target = body.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (target) {
      const offset =
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        8;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  }

  return { activeId, onScroll, jumpTo };
}
