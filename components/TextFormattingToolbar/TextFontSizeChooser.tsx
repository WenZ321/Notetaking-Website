import { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";
import "./TextFontSizeChooser.css";

type TextFontSizeChooserProps = {
  size: number;
  fontOptions: number[];
  onSizeChange: (size: number) => void;
};

/**
 * Allows users to select a font size for text formatting.
 * Displays a button with the currently selected font size and a dropdown of available font sizes.
 * Users can also type in a custom font size.
 */
export function TextFontSizeChooser({
  size,
  fontOptions,
  onSizeChange,
}: TextFontSizeChooserProps) {
  const datalistID = useId();

  const [fontValue, setFontValue] = useState<number | "">(size);
  const [valueBeforeEdit, setValueBeforeEdit] = useState(size);
  const [prevSize, setPrevSize] = useState(size);

  // Resyncs the input when the size changes from outside, like selecting other text
  if (size !== prevSize) {
    setPrevSize(size);
    setFontValue(size);
    setValueBeforeEdit(size);
  }

  const changeFontSize = (amount: number) => {
    const current = fontValue === "" ? valueBeforeEdit : fontValue;
    const newSize = Math.min(400, Math.max(1, current + amount));

    setFontValue(newSize);
    onSizeChange(newSize);
  };

  return (
    <div className="text-formatting-font-size-chooser">
      <button
        className="text-formatting-font-size-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => changeFontSize(-1)}
      >
        <Minus />
      </button>

      <input
        className="text-formatting-font-size-input"
        type="number"
        step={1}
        list={datalistID}
        value={fontValue}
        onKeyDown={(e) => {
          // block characters a number input would otherwise still allow
          if (["e", "E", "+", "-", "."].includes(e.key)) {
            e.preventDefault();
          }

          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        onFocus={() => {
          if (fontValue !== "") {
            setValueBeforeEdit(fontValue);
          }
        }}
        onChange={(e) => {
          if (e.target.value === "") {
            setFontValue("");
            return;
          }

          const size = e.target.valueAsNumber;

          if (!Number.isNaN(size)) {
            setFontValue(size);
            onSizeChange(size);
          }
        }}
        onBlur={() => {
          // empty field on blur - restore whatever the size was before editing
          if (fontValue === "") {
            setFontValue(valueBeforeEdit);
            return;
          }

          // clamp back down to the max if the user typed something too large
          if (Number(fontValue) > 400) {
            setFontValue(400);
            onSizeChange(400);
          }
        }}
      />

      <datalist id={datalistID}>
        {fontOptions.map((size) => (
          <option key={size} value={size} />
        ))}
      </datalist>

      <button
        className="text-formatting-font-size-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => changeFontSize(+1)}
      >
        <Plus />
      </button>
    </div>
  );
}
