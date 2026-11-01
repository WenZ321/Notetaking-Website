import type { BlockEditorComponentProps } from "../SharedNodeParts/NodeFactory/NodeComponentTypes";
import type { MatrixBlockAttrs } from "./MatrixBlockType";
import type { MatrixCellPosition } from "./MatrixCell";
import { useState } from "react";
import { BlockNodeEditorOverlay } from "../SharedNodeParts/BlockNodeUI/BlockNodeEditorOverlay";
import { MatrixCell } from "./MatrixCell";
import "./MatrixBlockEditor.css";

// Editor overlay for a matrix block: a grid of math-field cells, with
// controls to add/remove a row or column from the end.
export function MatrixBlockEditor({
  node,
  updateAttributes,
  closeEditor,
}: BlockEditorComponentProps<MatrixBlockAttrs>) {
  // edited locally first; only written back to the document on Save
  const [values, setValues] = useState<string[][]>(node.attrs.values);
  // at most one cell is a live math-field at a time; the rest stay previews
  const [activeCell, setActiveCell] = useState<MatrixCellPosition | null>(
    null,
  );

  const rows = values.length;
  const cols = values[0]?.length ?? 0;

  const setCell = (row: number, col: number, cellValue: string) => {
    setValues((prev) =>
      prev.map((r, rIndex) =>
        rIndex === row
          ? r.map((c, cIndex) => (cIndex === col ? cellValue : c))
          : r,
      ),
    );
  };

  const addRow = () => {
    setValues((prev) => [...prev, Array(cols).fill("")]);
  };

  const removeRow = () => {
    if (rows <= 1) return;
    setValues((prev) => prev.slice(0, -1));
    setActiveCell((current) =>
      current && current.row === rows - 1 ? null : current,
    );
  };

  const addCol = () => {
    setValues((prev) => prev.map((r) => [...r, ""]));
  };

  const removeCol = () => {
    if (cols <= 1) return;
    setValues((prev) => prev.map((r) => r.slice(0, -1)));
    setActiveCell((current) =>
      current && current.col === cols - 1 ? null : current,
    );
  };

  const handleSave = () => {
    updateAttributes({ values });
    closeEditor();
  };

  return (
    <BlockNodeEditorOverlay
      closeEditor={handleSave}
      backgroundClassName="matrix-block-editor-background"
    >
      <div className="matrix-block-editor-grid">
        {values.map((row, rowIndex) => (
          <div key={rowIndex} className="matrix-block-editor-row">
            {row.map((cellValue, colIndex) => (
              <MatrixCell
                key={colIndex}
                value={cellValue}
                isEditing={
                  activeCell?.row === rowIndex && activeCell?.col === colIndex
                }
                onChange={(newValue) => setCell(rowIndex, colIndex, newValue)}
                onActivate={() =>
                  setActiveCell({ row: rowIndex, col: colIndex })
                }
                onDeactivate={() =>
                  setActiveCell((current) =>
                    current?.row === rowIndex && current?.col === colIndex
                      ? null
                      : current,
                  )
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="matrix-block-editor-controls">
        <button onClick={addRow}>+ Row</button>
        <button onClick={removeRow} disabled={rows <= 1}>
          - Row
        </button>
        <button onClick={addCol}>+ Col</button>
        <button onClick={removeCol} disabled={cols <= 1}>
          - Col
        </button>
      </div>
    </BlockNodeEditorOverlay>
  );
}
