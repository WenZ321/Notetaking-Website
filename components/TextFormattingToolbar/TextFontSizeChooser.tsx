import { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";
import "./TextFontSizeChooser.css";

type TextFontSizeChooserProps = {
  defaultSize: number;
  fontOptions: number[];
  onSizeChange: (size: number) => void;
};

/**
 * Allows users to select a font size for text formatting.
 * Displays a button with the currently selected font size and a dropdown of available font sizes.
 * Users can also type in a custom font size.
 */
export default function TextFontSizeChooser({
  defaultSize,
  fontOptions,
  onSizeChange,
}: TextFontSizeChooserProps) {
  const datalistID = useId();

  const [fontValue, setFontValue] = useState<number | "">(defaultSize);
  const [valueBeforeEdit, setValueBeforeEdit] = useState(defaultSize);

  const changeFontSize = (amount: number) => {
    setFontValue((prev) => {
      const current = prev === "" ? valueBeforeEdit : prev;
      const newSize = Math.min(400, Math.max(1, current + amount));

      onSizeChange(newSize);

      return newSize;
    });
  };

  return (
    <div className="text-font-size-chooser">
      <button
        className="text-font-size-button"
        onClick={() => changeFontSize(-1)}
      >
        <Minus />
      </button>

      <input
        className="text-font-size-input"
        type="number"
        step={1}
        list={datalistID}
        value={fontValue}
        onKeyDown={(e) => {
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
          if (fontValue === "") {
            setFontValue(valueBeforeEdit);
          }

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
        className="text-font-size-button"
        onClick={() => changeFontSize(+1)}
      >
        <Plus />
      </button>
    </div>
  );
}
