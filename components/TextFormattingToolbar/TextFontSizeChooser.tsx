import { useEffect, useId, useState } from "react";
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
export default function TextFontSizeChooser({
  size,
  fontOptions,
  onSizeChange,
}: TextFontSizeChooserProps) {
  const datalistID = useId();

  const [fontValue, setFontValue] = useState<number | "">(size);
  const [valueBeforeEdit, setValueBeforeEdit] = useState(size);

  useEffect(() => {
    setFontValue(size);
    setValueBeforeEdit(size);
  }, [size]);

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
            return;
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
        className="text-formatting-font-size-button"
        onClick={() => changeFontSize(+1)}
      >
        <Plus />
      </button>
    </div>
  );
}
