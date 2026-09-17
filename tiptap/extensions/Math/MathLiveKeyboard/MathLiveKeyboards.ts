import type { VirtualKeyboardLayer } from "mathlive";
import { DefaultLayout } from "./MathLiveKeyboardLayout";
import { buildKeyboardLayer } from "./MathLiveKeyboardUtils";

// Default Keyboard Layout
export class DefaultKeyboardLayout {
  static readonly layer: VirtualKeyboardLayer =
    buildKeyboardLayer(DefaultLayout);
}
