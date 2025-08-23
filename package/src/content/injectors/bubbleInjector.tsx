import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import BubbleButton from "@/components/bubbleButton";
import { debounced } from "@/utils/helper";
import { BubbleProvider } from "@/content/providers/BubbleProvider";

export default function BubbleInjector({ dom }: { dom: BubbleProvider }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  // Single source of truth for (re)scanning the DOM
  const tick = useMemo(
    () =>
      debounced(() => {
        //console.log(dom.hasMeaningfulSelection());
        // If selection collapsed, close & bail early
        if (!dom.hasMeaningfulSelection()) {
          if (mounted.current) {
            setActive(false);
            setContainer(null);
          }
          return;
        }
        setTimeout(() => {
          if (!mounted.current) return;
          const host = dom.bubbleContainer();
          setActive(Boolean(host));
          const placeholder = document.createElement("div");
          placeholder.id = "my-ext-placeholder";
          let target : HTMLElement | null = null;
          if(host){
            let placeholder = host.querySelector<HTMLElement>('#my-ext-placeholder');
            if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.id = 'my-ext-placeholder';
            host.prepend(placeholder);
            }
          target = placeholder;
          }
          console.log(target);
          setContainer(target ?? null);
        }, 0); // keep 0–16ms; we're already debounced at the outer level
      }, 120),
    [dom]
  );

  useEffect(() => {
    const onSelectionChange = () => {
      // Let selection layout finish this frame, then tick
      requestAnimationFrame(() => tick());
    };

    const onMouseUp = () => {
      // The bubble usually appears just after mouseup; wait a hair
      setTimeout(() => tick(), 90);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(false);
        setContainer(null);
      } else {
        // Arrow keys can change selection without selectionchange firing everywhere
        requestAnimationFrame(() => tick());
      }
    };

    // Mutations: run tick, but don’t spam—MutationObserver can be noisy
    const mo = new MutationObserver(() => tick());
    mo.observe(document.documentElement, { childList: true, subtree: true });

    let scrollTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      // Hide while scrolling, then re-check a bit after it settles
      setActive(false);
      setContainer(null);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => tick(), 150);
    };

    document.addEventListener("selectionchange", onSelectionChange, true);
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("scroll", onScroll, { passive: true });

    // First paint: if user already has a selection (e.g. after SPA nav), try once
    setTimeout(() => tick(), 120);

    return () => {
      document.removeEventListener("selectionchange", onSelectionChange, true);
      document.removeEventListener("mouseup", onMouseUp, true);
      document.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("scroll", onScroll);
      mo.disconnect();
    };
  }, [tick]);

  // Guard against stale container nodes that were removed by the site
  useEffect(() => {
    if (container && !container.isConnected) {
      setContainer(null);
      setActive(false);
    }
  }, [container]);

  if (!active || !container) return null;
  const txt = dom.getSelectedText();
  return createPortal(<BubbleButton text={txt} />, container);
}
