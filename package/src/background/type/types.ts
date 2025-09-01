export type TabId = number;
export type ChatId = string;


export type NavIntent = {
  reason: "SIDE_PANEL_ADD_CHAT";
  // unique code to tag this flow (optional but safer)
  nonce: string;

  parentId: ChatId;
  // safety window (ms) to avoid stale notes
  deadline: number;
};