import type { VirtualKeyboardKeycap } from "mathlive";
import { toCssRule } from "./MathLiveKeycap";

type MathLiveActionKeyOptions = {
  label: string;
  command?: VirtualKeyboardKeycap["command"];
  class?: string;
  width?: VirtualKeyboardKeycap["width"];
  css?: Partial<CSSStyleDeclaration>;
};

let instanceCount = 0;

// A keycap that runs an editor command (delete, clear, undo, ...) rather
// than inserting LaTeX - kept separate from MathLiveKey since it has no
// latex to insert, just a label to show and a command to run. `command` is
// optional - a key can exist (e.g. a mode-switch key) before its behavior
// is wired up.
export class MathLiveActionKey {
  readonly label: string;
  readonly command?: VirtualKeyboardKeycap["command"];
  readonly class?: string;
  readonly width?: VirtualKeyboardKeycap["width"];

  private readonly css?: Partial<CSSStyleDeclaration>;
  // unique per-instance hook for toStyle()'s CSS rule to target only this
  // keycap, since class names are the only thing keycaps can be styled by
  private readonly styleClassName?: string;

  constructor(options: MathLiveActionKeyOptions) {
    this.label = options.label;
    this.command = options.command;
    this.width = options.width;
    this.css = options.css;

    if (options.css) this.styleClassName = `MLK__custom-action-${instanceCount++}`;

    this.class =
      [options.class, this.styleClassName].filter(Boolean).join(" ") ||
      undefined;
  }

  // CSS for this keycap alone, meant to be collected into a layer's `style`
  // alongside every other custom keycap used in that layer
  toStyle(): string {
    if (!this.css || !this.styleClassName) return "";
    return toCssRule(this.styleClassName, this.css);
  }
}

export const BACKSPACE = new MathLiveActionKey({
  label: "<svg class=svg-glyph><use xlink:href=#svg-delete-backward /></svg>",
  command: "performWithFeedback(deleteBackward)",
  class: "action bottom right hide-shift",
  width: 1,
});

export const CLEAR = new MathLiveActionKey({
  label: "<svg class=svg-glyph><use xlink:href=#svg-trash /></svg>",
  command: "deleteAll",
  class: "action warning",
  width: 1,
});

// mode-switch key (letters/text entry) - no command wired up yet
export const ABC = new MathLiveActionKey({
  label: "abc",
  width: 1,
  css: {
    backgroundColor: "#e8792c",
    color: "#ffffff",
    borderRadius: "6px",
    fontWeight: "600",
  },
});
