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
        ],

        askBubbleQ: ['div.aria-live\\=polite.absolute.select-none']

    },

    gemini: {

        branchButtonQ: ["..."],

        formQ: ["..."],

        editorQ: ["..."],

        submitButtonQ: ["..."],

        askBubbleQ : ["..."]

    },

    claude: {

        branchButtonQ: ["..."],

        formQ: ["..."],

        editorQ: ["..."],

        submitButtonQ: ["..."],

        askBubbleQ : ["..."]

    },

} as const satisfies Record<Provider, SelectorSet>;
