import type { MathLiveKey } from "./MathLiveKey";
import { MathLiveKeycap, type MathLiveKeycapOptions } from "./MathLiveKeycap";

const NORMAL_CSS: Partial<CSSStyleDeclaration> = {
  backgroundColor: "#ffffff",
  color: "#1a1a1a",
  borderRadius: "6px",
  borderBottom: "3px solid #e8792c",
  fontSize: "1.15em",
};

// Standard keycap - the default for most symbol keys (digits, operators,
// variables, ...). width defaults to 1 but can be overridden (e.g. a
// double-wide spacebar) without duplicating the styling.
export class NormalMathLiveKeycap extends MathLiveKeycap {
  constructor(key: MathLiveKey, width: MathLiveKeycapOptions["width"] = 1) {
    super(key, { width, css: NORMAL_CSS });
  }
}

const WIDE_CSS: Partial<CSSStyleDeclaration> = {
  ...NORMAL_CSS,
  fontWeight: "600",
};

// A wider keycap for symbols that need more horizontal room to not look
// cramped (e.g. \sqrt, \int).
export class WideMathLiveKeycap extends MathLiveKeycap {
  constructor(key: MathLiveKey) {
    super(key, { width: 1.5, css: WIDE_CSS });
  }
}
