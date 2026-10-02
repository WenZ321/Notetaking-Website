import type { MathLiveKey } from "./MathLiveKey";
import { MathLiveKeycap, type MathLiveKeycapOptions } from "./MathLiveKeycap";

// Normal keycap
export class NormalMathLiveKeycap extends MathLiveKeycap {
  static readonly CSS: Partial<CSSStyleDeclaration> = {
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
    borderRadius: "6px",
    borderBottom: "3px solid #e8792c",
    fontSize: "1.15em",
  };

  constructor(key: MathLiveKey, width: MathLiveKeycapOptions["width"] = 1) {
    super(key, { width, css: NormalMathLiveKeycap.CSS });
  }
}

// A wider keycap
export class WideMathLiveKeycap extends MathLiveKeycap {
  static readonly CSS: Partial<CSSStyleDeclaration> = {
    ...NormalMathLiveKeycap.CSS,
    fontWeight: "600",
  };

  constructor(key: MathLiveKey) {
    super(key, { width: 1.5, css: WideMathLiveKeycap.CSS });
  }
}
