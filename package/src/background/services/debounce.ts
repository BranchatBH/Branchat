import type { TabId } from "../type/types";

const debounceTimers = new Map<TabId, number>();
export function debounce(tabId: number, fn: () => void, delayMs = 200) {
  const old = debounceTimers.get(tabId);
  if (old) clearTimeout(old);
  const t = setTimeout(fn, delayMs) as unknown as number;
  debounceTimers.set(tabId, t);
}