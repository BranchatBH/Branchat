export function getEditorEl(): HTMLDivElement | null {
    return (
        (document.querySelector(
        "#prompt-textarea.ProseMirror[contenteditable='true']"
        ) as HTMLDivElement) ||
        (document.querySelector(".ProseMirror[contenteditable='true']") as HTMLDivElement)
    );
}

export function findSendButton(root: Document | HTMLElement = document): HTMLButtonElement | null {
    const candidates = [
        "[data-testid='send-button']",
        "[data-testid='composer-trailing-actions'] button#composer-submit-button",
        "button[aria-label*='Send']",
        "button[aria-label*='전송']",
        ".composer-submit-btn",
    ];
    for (const sel of candidates) {
        const btn = root.querySelector(sel) as HTMLButtonElement | null;
        if (btn) 
            {
                console.log(sel);
                return btn;
            }
    }
    return null;
}

export default {
    getEditorEl,
    findSendButton,
}