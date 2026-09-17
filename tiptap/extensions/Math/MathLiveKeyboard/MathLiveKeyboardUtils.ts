import type { VirtualKeyboardKeycap, VirtualKeyboardLayer } from "mathlive";
import { SPACE } from "./MathLiveKey";
import { MathLiveActionKey } from "./MathLiveActionKey";
import { NormalMathLiveKeycap } from "./MathLiveKeycapTypes";
import type { MathLiveKeyboardLayout } from "./MathLiveKeyboardLayout";

type CustomKeycap = NormalMathLiveKeycap | MathLiveActionKey;

// process each key into a keycap
function buildKeycapRows(layout: MathLiveKeyboardLayout): CustomKeycap[][] {
  const keycapRows: CustomKeycap[][] = [];

  for (const row of layout) {
    const keycapRow: CustomKeycap[] = [];

    for (const entry of row) {
      if (entry instanceof MathLiveActionKey) {
        keycapRow.push(entry);
      } else {
        keycapRow.push(
          new NormalMathLiveKeycap(entry, entry === SPACE ? 2 : 1),
        );
      }
    }

    keycapRows.push(keycapRow);
  }

  return keycapRows;
}

function toKeycapEntry(entry: CustomKeycap): Partial<VirtualKeyboardKeycap> {
  return entry instanceof MathLiveActionKey ? entry : entry.toKeycap();
}

export function buildKeyboardLayer(
  layout: MathLiveKeyboardLayout,
): VirtualKeyboardLayer {
  const keycapRows = buildKeycapRows(layout);

  return {
    rows: keycapRows.map((row) =>
      row.map(toKeycapEntry),
    ) as VirtualKeyboardLayer["rows"],
    style: keycapRows
      .flat()
      .map((entry) => entry.toStyle())
      .filter(Boolean)
      .join("\n"),
  };
}
