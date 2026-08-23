import { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";
import "./FontSizeChooser.css";

type FontSizeChooserProps = {
  defaultSize: number;
  fontOptions: number[];
  onSizeChange: (size: number) => void;
};

export default function FontSizeChooser({
  defaultSize,
  fontOptions,
  onSizeChange,
}: FontSizeChooserProps) {
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
    <div className="font-size-chooser">
      <button className="font-size-button" onClick={() => changeFontSize(-1)}>
        <Minus />
      </button>

      <input
        className="user-size-input"
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

      <button className="font-size-button" onClick={() => changeFontSize(+1)}>
        <Plus />
      </button>
    </div>
  );
}
