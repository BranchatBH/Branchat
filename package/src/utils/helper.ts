export function findByTags<T extends HTMLElement>(root: Document | HTMLElement = document, tags: string[]): T | null {
    // ["p", "div", "span"] -> "p,div,span"
    const selector = tags.join(','); 
    return root.querySelector(selector) as T | null;
  }

  export function findAllByTag<T extends HTMLElement>(root: Document | HTMLElement = document, tag: string): NodeListOf<T> {
    // querySelectorAll은 null을 반환하지 않으므로, null 체크가 불필요합니다.
    return root.querySelectorAll(tag) as NodeListOf<T>;
  }

  export const debounced = <T extends (...args: any[]) => void>(fn: T, ms = 80) => {
    let timer: ReturnType<typeof setTimeout>;
  
    // 'this' 컨텍스트와 인자를 제대로 전달하기 위해 일반 함수를 사용합니다.
    return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // fn.apply를 사용해 원래 함수의 'this'를 유지합니다.
        fn.apply(this, args);
      }, ms);
    };
  };

