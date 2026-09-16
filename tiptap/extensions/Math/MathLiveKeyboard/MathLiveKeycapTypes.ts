import type { MathLiveKey } from "./MathLiveKey";
import { MathLiveKeycap } from "./MathLiveKeycap";

// Standard single-width keycap - the default for most symbol keys (digits,
// operators, pi, ...).
export class NormalMathLiveKeycap extends MathLiveKeycap {
  constructor(key: MathLiveKey) {
    super(key, {
      width: 1,
      css: {
        backgroundColor: "#2a2a2e",
        color: "#f5f5f5",
        borderRadius: "8px",
        fontSize: "1.1em",
      },
    });
  }
}

// A wider keycap for symbols that need more horizontal room to not look
// cramped (e.g. \sqrt, \int). Given a distinct accent color so function-like
// keys visually stand out from plain digits/operators.
export class WideMathLiveKeycap extends MathLiveKeycap {
  constructor(key: MathLiveKey) {
    super(key, {
      width: 1.5,
      css: {
        backgroundColor: "#3a3450",
        color: "#e6def9",
        borderRadius: "8px",
        fontSize: "1.1em",
        fontWeight: "600",
      },
    });
  }
}
