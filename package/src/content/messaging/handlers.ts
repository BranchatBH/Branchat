// src/content/messaging/handlers.ts
import type { InboundMsg } from "./types";
import { Render } from "../app";
import { detectProviderFromLocation } from "@/utils/detect";
import type { Provider } from "@/types/types";
import { fillAndSubmit } from "@/content/dom/fillAndSubmit";

export const handlers = {
  PING(_msg: InboundMsg, _send: (v:any)=>void) {
    _send({ ready: true });
  },

  POST_NAVIGATE(_msg: InboundMsg, send: (v:any)=>void) {
    Render();
    send({ ok: true });
  },

  RUN_FILL_AND_SUBMIT: async (msg: InboundMsg, send: (v:any)=>void) => {
    try {
      const provider: Provider | null = detectProviderFromLocation(window.location);
      const ok = await fillAndSubmit((msg as any).prompt ?? "", provider);
      Render();
      send({ success: ok });
    } catch (e) {
      send({ success: false, error: String(e) });
    }
  },
} as const;
