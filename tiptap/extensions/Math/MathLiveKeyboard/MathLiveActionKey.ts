import type { VirtualKeyboardKeycap } from "mathlive";

type MathLiveActionKeyOptions = {
  label: string;
  command: VirtualKeyboardKeycap["command"];
  class?: string;
  width?: VirtualKeyboardKeycap["width"];
};

// A keycap that runs an editor command (delete, clear, undo, ...) rather
// than inserting LaTeX - kept separate from MathLiveKey since it has no
// latex to insert, just a label to show and a command to run.
export class MathLiveActionKey {
  readonly label: string;
  readonly command: VirtualKeyboardKeycap["command"];
  readonly class?: string;
  readonly width?: VirtualKeyboardKeycap["width"];

  constructor(options: MathLiveActionKeyOptions) {
    this.label = options.label;
    this.command = options.command;
    this.class = options.class;
    this.width = options.width;
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
