// 2) ProseMirror에 텍스트 "앞에" 넣는 유틸
export default function prependToProseMirror(editor: HTMLDivElement, text: string) {
  console.log("prepending..");
  if (!editor || !text) return;

  // 이미 붙어있으면 중복 방지
  const now = editor.textContent ?? '';
  if (now.startsWith(text)) return;

  editor.focus();

  // 커서를 맨 앞으로
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(true); // start
  sel?.removeAllRanges();
  sel?.addRange(range);

  // ProseMirror가 잘 받는 beforeinput 이벤트 우선
  const evt = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: text,
    bubbles: true,
    cancelable: true,
  });
  const accepted = editor.dispatchEvent(evt);

  // 일부 환경에서 beforeinput을 무시하면 execCommand로 폴백
  if (!accepted || (editor.textContent ?? '').startsWith(text) === false) {
    // execCommand는 deprecated지만 contenteditable에선 여전히 잘 동작
    document.execCommand('insertText', false, text);
  }

  // 줄바꿈 하나 추가 (원문과 구분)
  document.execCommand('insertText', false, '\n');
}
