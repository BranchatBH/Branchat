import { Logger } from "@/utils/logger";

let wired = false;

const logger = new Logger("content script");

function onError(e: ErrorEvent) {
  logger.error("Content ErrorEvent:", e.error ?? e.message ?? e);
}

function onReject(e: PromiseRejectionEvent) {
  logger.error("Content UnhandledRejection:", e.reason);
}

export function installErrorListeners() {
  if(wired) return; 
  wired = true;
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onReject);
}

export function uninstallErrorListeners() {
  wired = false;
  window.removeEventListener("error", onError);
  window.removeEventListener("unhandledrejection", onReject);
}
