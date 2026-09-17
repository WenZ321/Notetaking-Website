import type { VirtualKeyboardKeycap, VirtualKeyboardLayer } from "mathlive";
import { SPACE } from "./MathLiveKey";
import { MathLiveActionKey } from "./MathLiveActionKey";
import { NormalMathLiveKeycap } from "./MathLiveKeycapTypes";
import { rows } from "./MathLiveKeyboardRows";

type CustomKeycap = NormalMathLiveKeycap | MathLiveActionKey;

// Mathway-style default layout: replicates its 5-row grid (parens/roots,
// variables+digits+templates, operators, comparisons) plus an `abc` mode key
// and a wide spacebar on the last row. Owns the choice to wrap every raw
// MathLiveKey (from MathLiveKeyboardRows) in a NormalMathLiveKeycap - a
// different layout could make a different choice here.
export class DefaultKeyboardLayout {
  // process each raw MathLiveKey into a NormalMathLiveKeycap (MathLiveActionKey
  // entries, like ABC, are already fully custom and pass through as-is)
  private static buildKeycapRows(): CustomKeycap[][] {
    const keycapRows: CustomKeycap[][] = [];

    for (const row of rows) {
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

  private static toKeycapEntry(
    entry: CustomKeycap,
  ): Partial<VirtualKeyboardKeycap> {
    return entry instanceof MathLiveActionKey ? entry : entry.toKeycap();
  }

  private static readonly keycapRows: CustomKeycap[][] =
    DefaultKeyboardLayout.buildKeycapRows();

  static readonly layer: VirtualKeyboardLayer = {
    rows: DefaultKeyboardLayout.keycapRows.map((row) =>
      row.map(DefaultKeyboardLayout.toKeycapEntry),
    ) as VirtualKeyboardLayer["rows"],
    style: DefaultKeyboardLayout.keycapRows
      .flat()
      .map((entry) => entry.toStyle())
      .filter(Boolean)
      .join("\n"),
  };
}
