type Props = {
  latex: string;
  setLatex: (latex: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

// Toolbar of quick LaTeX inserts for a math block editor. Not currently used anywhere.
export function MathEditorToolbar({
  latex,
  setLatex,
  onSave,
  onCancel,
}: Props) {
  const insertLatex = (value: string) => {
    setLatex(latex + value);
  };

  return (
    <div className="math-editor-toolbar">
      <button type="button" onClick={() => insertLatex("^{}")}>
        xⁿ
      </button>

      <button type="button" onClick={() => insertLatex("_{}")}>
        xₙ
      </button>

      <button type="button" onClick={() => insertLatex("\\frac{}{}")}>
        fraction
      </button>

      <button type="button" onClick={() => insertLatex("\\sqrt{}")}>
        √
      </button>

      <button type="button" onClick={() => insertLatex("\\pi")}>
        π
      </button>

      <button type="button" onClick={() => insertLatex("\\theta")}>
        θ
      </button>

      <button type="button" onClick={onSave}>
        Save
      </button>

      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
