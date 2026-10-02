type ChemBlockEditorSlotControlsProps = {
  label: string;
  canRemove: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

// The add/remove-slot controls for one side, rendered in their own row below
// the equation so they don't affect the equation row's vertical alignment.
export function ChemBlockEditorSlotControls({
  label,
  canRemove,
  onAdd,
  onRemove,
}: ChemBlockEditorSlotControlsProps) {
  return (
    <div className="chem-block-editor-slot-controls">
      <button onClick={onAdd}>+ {label}</button>
      <button onClick={onRemove} disabled={!canRemove}>
        - {label}
      </button>
    </div>
  );
}
