export function extractMarkdown(root: HTMLDivElement | null): string {
  type Ctx = {
    listStack: ("ul" | "ol")[];
    olCounters: number[];
    inPre: boolean; // we don't collapse whitespace inside <pre>
  };
  if(!root) return '';

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "BUTTON",
    "SVG",
    "PATH",
  ]);

  function isVisible(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return true;
    if (el.closest("[hidden], [aria-hidden='true']")) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  // conservative UI-chrome filter (copy/edit toolbars, code headers)
  function isUiChrome(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const c = el.className?.toString() ?? "";
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    return (
      /\bcontain-inline-size\b|\bsticky\b|\btoken-|rounded-2xl|select-none|icon-xs/.test(
        c
      ) ||
      aria === "복사" ||
      aria === "편집"
    );
  }

  function compress(text: string, keepWhitespace: boolean): string {
    if (keepWhitespace) return text;
    // Collapse runs of whitespace to a single space, but keep non-breaking-ish content
    return text.replace(/\s+/g, " ");
  }

  function fence(lang: string | undefined, body: string): string {
    const safe = body.replace(/\s+$/g, "");
    return `\n\n\`\`\`${lang ?? ""}\n${safe}\n\`\`\`\n\n`;
  }

  function inlineCode(s: string): string {
    // surround with backticks; if it contains backticks, use triple backticks inline
    if (s.includes("`")) return "`` " + s + " ``";
    return "`" + s + "`";
  }

  function getCodeLang(node: Element | null | undefined): string | undefined {
    if (!node) return;
    const klass = (node as HTMLElement).className || "";
    const m =
      /(language|lang)-([A-Za-z0-9+_-]+)/.exec(klass) ||
      /(?:^|\s)([A-Za-z0-9+_-]+)(?:\s|$)/.exec(klass);
    // prefer the language-* capture; fallback to the single token
    return (m && (m[2] || m[1])) || undefined;
  }

  function toMd(node: Node, ctx: Ctx): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = (node.textContent ?? "");
      return compress(raw, ctx.inPre);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;

    if (SKIP_TAGS.has(el.tagName)) return "";
    if (!isVisible(el)) return "";
    if (isUiChrome(el)) {
      // descend through chrome, but don't render it
      return Array.from(el.childNodes).map(n => toMd(n, ctx)).join("");
    }

    const kids = () =>
      Array.from(el.childNodes).map(n => toMd(n, ctx)).join("");

    switch (el.tagName) {
      case "BR":
        return "  \n";

      case "STRONG":
      case "B":
        return `**${kids().trim()}**`;

      case "EM":
      case "I":
        return `_${kids().trim()}_`;

      case "DEL":
      case "S":
        return `~~${kids().trim()}~~`;

      case "CODE": {
        // If inside <pre>, let PRE branch handle; here treat as inline
        if (ctx.inPre) return el.textContent ?? "";
        const inner = (el.textContent ?? "").trim();
        return inner ? inlineCode(inner) : "";
      }

      case "PRE": {
        // capture nested <code> (preferred), otherwise raw textContent
        const prev = { ...ctx };
        ctx.inPre = true;
        const codeEl = el.querySelector("code");
        const lang = getCodeLang(codeEl);
        const body = codeEl?.textContent ?? el.textContent ?? "";
        const out = fence(lang, body);
        ctx.inPre = prev.inPre;
        return out;
      }

      case "A": {
        const href = el.getAttribute("href") || "";
        const label = kids().trim() || href;
        return href ? `[${label}](${href})` : label;
      }

      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const level = Number(el.tagName[1]);
        return `\n\n${"#".repeat(level)} ${kids().trim()}\n\n`;
      }

      case "UL": {
        ctx.listStack.push("ul");
        ctx.olCounters.push(0);
        const out =
          "\n" +
          Array.from(el.children).map(li => toMd(li, ctx)).join("") +
          "\n";
        ctx.listStack.pop();
        ctx.olCounters.pop();
        return out;
      }

      case "OL": {
        ctx.listStack.push("ol");
        ctx.olCounters.push(0);
        const out =
          "\n" +
          Array.from(el.children).map(li => toMd(li, ctx)).join("") +
          "\n";
        ctx.listStack.pop();
        ctx.olCounters.pop();
        return out;
      }

      case "LI": {
        const depth = ctx.listStack.length;
        const indent = "  ".repeat(Math.max(0, depth - 1));
        if (ctx.listStack[depth - 1] === "ol") {
          ctx.olCounters[depth - 1] += 1;
          return `${indent}${ctx.olCounters[depth - 1]}. ${kids().trim()}\n`;
        } else {
          return `${indent}- ${kids().trim()}\n`;
        }
      }

      case "HR":
        return `\n\n---\n\n`;

      case "BLOCKQUOTE":
        return `\n\n> ${kids().trim()}\n\n`;

      case "IMG": {
        const src = el.getAttribute("src") || "";
        const alt = (el.getAttribute("alt") || "").trim();
        return src ? `![${alt}](${src})` : "";
      }

      case "P":
        return `\n\n${kids().trim()}\n\n`;

      default: {
        // Treat sectioning/block containers as paragraphs; inline otherwise
        const blockish = /^(DIV|SECTION|ARTICLE|HEADER|FOOTER|MAIN|NAV|ASIDE|FIGURE|FIGCAPTION)$/.test(
          el.tagName
        );
        return blockish ? `\n\n${kids().trim()}\n\n` : kids();
      }
    }
  }
    const md = toMd(root, { listStack: [], olCounters: [], inPre: false })
    // tidy whitespace
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

    return md;
}
