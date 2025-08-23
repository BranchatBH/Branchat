export type PingMsg = { type: "PING" };
export type PostNavigateMsg = { type: "POST_NAVIGATE" };
export type RunFillAndSubmitMsg = { type: "RUN_FILL_AND_SUBMIT"; prompt?: string };

export type InboundMsg = PingMsg | PostNavigateMsg | RunFillAndSubmitMsg;
