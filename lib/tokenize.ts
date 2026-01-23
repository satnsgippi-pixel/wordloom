// lib/tokenize.ts
// 方針:
// - 句読点・括弧・引用符などは独立トークン
// - アポストロフィ(' or ’) とハイフン(-)は単語の一部扱い
// - ... / … / — は1トークン
// - 絵文字などは登録時に弾く想定（ここでは落ちないように1文字トークン化）

const isLetterOrDigit = (ch: string) => /[A-Za-z0-9]/.test(ch);
const isApostrophe = (ch: string) => ch === "'" || ch === "’";
const isHyphen = (ch: string) => ch === "-";

function isWordChar(ch: string): boolean {
  return isLetterOrDigit(ch) || isApostrophe(ch) || isHyphen(ch);
}

function isWhitespace(ch: string): boolean {
  return /\s/.test(ch);
}

export function tokenize(en: string): string[] {
  const s = (en ?? "").trim();
  if (!s) return [];

  const tokens: string[] = [];
  let i = 0;

  const push = (t: string) => {
    if (t.length > 0) tokens.push(t);
  };

  while (i < s.length) {
    const ch = s[i];

    // skip whitespace
    if (isWhitespace(ch)) {
      i++;
      continue;
    }

    // special multi-char punctuation
    if (s.startsWith("...", i)) {
      push("...");
      i += 3;
      continue;
    }
    if (s.startsWith("…", i)) {
      push("…");
      i += 1;
      continue;
    }
    if (s.startsWith("—", i)) {
      push("—");
      i += 1;
      continue;
    }

    // word token (letters/digits + apostrophe/hyphen)
    if (isWordChar(ch)) {
      let j = i + 1;
      while (j < s.length && isWordChar(s[j])) j++;
      push(s.slice(i, j));
      i = j;
      continue;
    }

    // everything else is a single-char token (punctuation, quotes, brackets, etc.)
    push(ch);
    i++;
  }

  return tokens;
}
