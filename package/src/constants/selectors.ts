import type { Provider, SelectorSet } from "@/types/types";

export const SELECTORS = {

    chatgpt : {

        branchButtonQ : ['div.flex.flex-wrap.items-center.gap-y-4.select-none'],

        formQ : ['form[data-type="unified-composer"]'],

        editorQ : ['#prompt-textarea.ProseMirror[contenteditable="true"]', ".ProseMirror[contenteditable='true']"],

        submitButtonQ : 
        [
            "[data-testid='send-button']",
            "[data-testid='composer-trailing-actions'] button#composer-submit-button",
            "button[aria-label*='Send']",
            "button[aria-label*='전송']",
            ".composer-submit-btn"
        ]

    },

    gemini: {

        branchButtonQ: ["..."],

        formQ: ["..."],

        editorQ: ["..."],

        submitButtonQ: ["..."],

    },

    claude: {

        branchButtonQ: ["..."],

        formQ: ["..."],

        editorQ: ["..."],

        submitButtonQ: ["..."],

    },

} as const satisfies Record<Provider, SelectorSet>;
