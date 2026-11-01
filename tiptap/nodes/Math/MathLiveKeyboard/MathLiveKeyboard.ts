import type { MathfieldElement } from "mathlive";
import { DefaultKeyboardLayout, TempKeyboardLayout } from "./MathLiveKeyboards";
import { DEFAULT_LAYER_ID, TEMP_LAYER_ID } from "./MathLiveKeyboardLayerIds";

const customLayout = {
  id: "custom",
  label: "Custom",
  layers: [DefaultKeyboardLayout.layer, TempKeyboardLayout.layer],
  // hide the default undo/redo/paste toolbar mathlive adds to every layout
  displayEditToolbar: false,
};

// One entry per layer in customLayout, for a caller (e.g. a React header
// bar) to render a button that jumps straight to that layer.
export const LAYER_OPTIONS = [
  { id: DEFAULT_LAYER_ID, label: "123" },
  { id: TEMP_LAYER_ID, label: "?!#" },
];

// Owns mathlive's virtual keyboard singleton for one math field
// mounts it into a div container
export class MathLiveKeyboard {
  private readonly mathfield: MathfieldElement;
  private showTimeout: number | undefined;

  constructor(mathfield: MathfieldElement) {
    this.mathfield = mathfield;
  }

  private get keyboard() {
    return window.mathVirtualKeyboard;
  }

  // redirect mathlive's global keyboard singleton into our container
  mount(container: HTMLElement): void {
    const keyboard = this.keyboard;

    keyboard.container = container;
    keyboard.layouts = [customLayout];
    this.mathfield.mathVirtualKeyboardPolicy = "manual";

    // deferred one tick: <math-field> needs a moment to init after mounting,
    // or focus()/show() can silently no-op
    this.showTimeout = window.setTimeout(() => {
      // starts at the end, so typing adds to the equation instead of in front of it
      this.mathfield.position = this.mathfield.lastOffset;
      this.mathfield.focus();
      keyboard.show();
    }, 0);
  }

  unmount(): void {
    const keyboard = this.keyboard;

    // cancel the deferred focus/show if it hasn't fired yet
    window.clearTimeout(this.showTimeout);

    // restore the singleton so the next math field isn't left pointing here
    keyboard.hide();
    keyboard.container = document.body;
  }

  // jump to a keyboard layer by id
  switchLayer(layerId: string): void {
    this.keyboard.executeCommand(["switchKeyboardLayer", layerId]);
  }
}
