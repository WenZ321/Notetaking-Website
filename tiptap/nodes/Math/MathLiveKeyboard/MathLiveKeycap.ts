import type { VirtualKeyboardKeycap } from "mathlive";
import type { MathLiveKey } from "./MathLiveKey";

export type MathLiveKeycapOptions = {
  tooltip?: string; // Hover keycap for tooltip
  width?: VirtualKeyboardKeycap["width"];
  css?: Partial<CSSStyleDeclaration>;
};

// A styled, sized keycap built from a MathLiveKey.
export class MathLiveKeycap {
  private static keycapCounter = 0;

  // Convert camelCase CSS property names to kebab-case for CSS formatting
  private static toKebabCase(property: string): string {
    return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  private readonly key: MathLiveKey;
  private readonly options: MathLiveKeycapOptions;
  // Each keycap's unique ID built from its LaTex and the counter
  private readonly className: string;

  constructor(key: MathLiveKey, options: MathLiveKeycapOptions = {}) {
    this.key = key;
    this.options = options;

    const alphanumericLatex = key.latex.replace(/[^a-zA-Z0-9]/g, "");
    this.className = `MLK__custom-${alphanumericLatex}-${MathLiveKeycap.keycapCounter++}`;
  }

  toKeycap(): Partial<VirtualKeyboardKeycap> {
    return {
      latex: this.key.latex,
      label: this.key.label,
      tooltip: this.options.tooltip,
      width: this.options.width,
      class: this.className,
    };
  }

  // CSS for keycap
  toStyle(): string {
    const { css } = this.options;

    if (!css) return "";

    const declarations = Object.entries(css)
      .map(
        ([property, value]) =>
          `${MathLiveKeycap.toKebabCase(property)}: ${value};`,
      )
      .join(" ");

    return `.${this.className} { ${declarations} }`;
  }
}
