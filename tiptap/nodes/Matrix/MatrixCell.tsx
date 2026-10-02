import type { MathfieldElement } from "mathlive";
import { useEffect, useRef } from "react";
import { InlineMath } from "react-katex";
import { useMathfieldClickToPosition } from "../Math/useMathfieldClickToPosition";
import "katex/dist/katex.min.css";
import "mathlive";

export type MatrixCellPosition = {
  row: number;
  col: number;
};

type MatrixCellProps = {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
};

// One matrix cell: a lightweight KaTeX preview until activated, then swaps
// to a live math-field - which cell (if any) is active is owned by
// MatrixBlockEditor, so at most one mathlive instance ever exists at once.
export function MatrixCell({
  value,
  isEditing,
  onChange,
  onActivate,
  onDeactivate,
}: MatrixCellProps) {
  const mf = useRef<MathfieldElement | null>(null);

  // re-attach once isEditing flips true and the math-field actually mounts
  useMathfieldClickToPosition(mf, [isEditing]);

  useEffect(() => {
    if (isEditing) mf.current?.focus();
  }, [isEditing]);

  if (!isEditing) {
    return (
      <div className="matrix-block-editor-cell-preview" onClick={onActivate}>
        <InlineMath math={value} />
      </div>
    );
  }

  return (
    <math-field
      ref={mf}
      className="matrix-block-editor-cell"
      onInput={(event) => {
        onChange((event.target as MathfieldElement).value);
      }}
      onBlur={onDeactivate}
    >
      {value}
    </math-field>
  );
}
