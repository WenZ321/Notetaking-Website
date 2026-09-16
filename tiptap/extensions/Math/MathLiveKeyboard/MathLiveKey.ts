// A math symbol's identity: what LaTeX it inserts and how it's labeled.
// Omit label to have mathlive typeset `latex` itself as the label.
export class MathLiveKey {
  readonly latex: string;
  readonly label?: string;

  constructor(latex: string, label?: string) {
    this.latex = latex;
    this.label = label;
  }
}

export const ZERO = new MathLiveKey("0", "0");
export const ONE = new MathLiveKey("1", "1");
export const TWO = new MathLiveKey("2", "2");
export const THREE = new MathLiveKey("3", "3");
export const FOUR = new MathLiveKey("4", "4");
export const FIVE = new MathLiveKey("5", "5");
export const SIX = new MathLiveKey("6", "6");
export const SEVEN = new MathLiveKey("7", "7");
export const EIGHT = new MathLiveKey("8", "8");
export const NINE = new MathLiveKey("9", "9");

export const PLUS = new MathLiveKey("+", "+");
export const MINUS = new MathLiveKey("-", "−");
export const MULTIPLY = new MathLiveKey("\\times", "×");
export const DIVIDE = new MathLiveKey("/", "/");
export const EQUALS = new MathLiveKey("=", "=");
export const DECIMAL_POINT = new MathLiveKey(".", ".");
export const OPEN_PAREN = new MathLiveKey("(", "(");
export const CLOSE_PAREN = new MathLiveKey(")", ")");

export const SUPERSCRIPT = new MathLiveKey("^", "^");
export const SUBSCRIPT = new MathLiveKey("_", "_");

export const PI = new MathLiveKey("\\pi", "π");
export const SQRT = new MathLiveKey("\\sqrt");
export const SIN = new MathLiveKey("\\sin", "sin");

export const INDEFINITEINTEGRAL = new MathLiveKey("\\int");
export const DEFINITEINTEGRAL = new MathLiveKey("\\int_{a}^{b}");
