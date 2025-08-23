export function findByTags<T extends HTMLElement>(root : Document | HTMLElement = document, tags : string[]) : T | null {
  for (const tag of tags){
      const elem = root.querySelector(tag) as T | null;
      if(elem) return elem;
  }

  return null;
}

export function findAllByTag<T extends HTMLElement>(root: Document | HTMLElement = document, tag: string): NodeListOf<T> {
  return root.querySelectorAll(tag) as NodeListOf<T>;
}

export const debounced = <T extends (...args : any[]) => any>(fn : T, ms = 80) => {

  let t : ReturnType<typeof setTimeout>;

  return (...args : Parameters<T>) : Promise<ReturnType<T>> => {
      clearTimeout(t);
      
      return new Promise((resolve) => {
          t = setTimeout(() => {
              const result = fn(...args);
              resolve(result);
          }, ms)
      })
  }

};

