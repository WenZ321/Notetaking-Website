import type { VirtualKeyboardKeycap } from "mathlive";
import type { MathLiveKey } from "./MathLiveKey";

export type MathLiveKeycapOptions = {
  tooltip?: string;
  width?: VirtualKeyboardKeycap["width"];
  css?: Partial<CSSStyleDeclaration>;
};

function toKebabCase(property: string): string {
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// A styled, sized keycap built from a MathLiveKey. Bundles the mathlive
// keycap config (latex/label/width/tooltip) together with arbitrary CSS, so
// a keycap's appearance stays in one place instead of a config object here
// and matching CSS rules maintained separately elsewhere.
export class MathLiveKeycap {
  private readonly key: MathLiveKey;
  private readonly options: MathLiveKeycapOptions;
  // unique per-instance hook for toStyle()'s CSS rule to target only this
  // keycap, since class names are the only thing keycaps can be styled by
  private readonly className: string;

  constructor(key: MathLiveKey, options: MathLiveKeycapOptions = {}) {
    this.key = key;
    this.options = options;
    this.className = `MLK__custom-${key.latex.replace(/[^a-zA-Z0-9]/g, "")}`;
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

  // CSS for this keycap alone, meant to be collected into a layer's `style`
  // alongside every other custom keycap used in that layer
  toStyle(): string {
    const { css } = this.options;

    if (!css) return "";

    const declarations = Object.entries(css)
      .map(([property, value]) => `${toKebabCase(property)}: ${value};`)
      .join(" ");

    return `.${this.className} { ${declarations} }`;
  }
}
