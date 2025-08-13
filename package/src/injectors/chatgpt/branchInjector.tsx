import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NewChatButton from "@/components/newChatButton";
import { DomProvider } from "@/providers/DomProvider";

type Props = { dom: DomProvider };

export default function BranchInjector({ dom }: Props) {
  const [targets, setTargets] = useState<HTMLElement[]>([]);

  const inject = () => {
    const bars = Array.from(dom.branchButtons() ?? []);
    const newHosts: HTMLElement[] = [];

    bars.forEach((bar) => {
      // Prevent multiple injections in the same footer bar
      if (bar.dataset.branchatInjected === "true") return;

      const grow = bar.querySelector<HTMLElement>(".grow");

      const host = document.createElement("span");
      host.style.display = "inline-block";
      host.style.marginLeft = "6px";
      host.style.verticalAlign = "middle";

      if (grow && grow.parentElement === bar) {
        bar.insertBefore(host, grow);
      } else {
        bar.appendChild(host);
      }

      bar.dataset.branchatInjected = "true"; // mark this bar as done
      newHosts.push(host);
    });

    if (newHosts.length > 0) {
      setTargets((prev) => [...prev, ...newHosts]);
    }
  };

  const watchStreamSettle = (root: HTMLElement) => {
    let timer: number | null = null;
    const mo = new MutationObserver(() => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => inject(), 1200);
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      mo.disconnect();
      if (timer) clearTimeout(timer);
    };
  };

  useEffect(() => {
    inject(); // initial
    const cleanup = watchStreamSettle(document.body);
    return cleanup;
  }, []);

  if (targets.length === 0) return null;

  return (
    <>
      {targets.map((t, idx) =>
        createPortal(<NewChatButton id={idx} />, t, `branchat-${idx}`)
      )}
    </>
  );
}
