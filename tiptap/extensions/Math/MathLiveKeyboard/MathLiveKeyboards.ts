import type { VirtualKeyboardLayer } from "mathlive";
import { DefaultLayout, TempLayout } from "./MathLiveKeyboardLayout";
import { buildKeyboardLayer } from "./MathLiveKeyboardUtils";
import {
  DEFAULT_LAYER_ID,
  TEMP_LAYER_ID,
} from "./MathLiveKeyboardLayerIds";

// Default Keyboard Layout
export class DefaultKeyboardLayout {
  static readonly layer: VirtualKeyboardLayer = buildKeyboardLayer(
    DefaultLayout,
    DEFAULT_LAYER_ID,
  );
}

// Temp Keyboard Layout - placeholder second layout, switched to via
// the header bar's layer buttons
export class TempKeyboardLayout {
  static readonly layer: VirtualKeyboardLayer = buildKeyboardLayer(
    TempLayout,
    TEMP_LAYER_ID,
  );
}
