import { useId } from "react";
import "./ComboBox.css";

type ComboBoxProps = {
  defaultValue: string;
  options: string[];
  onValueChange: (value: string) => void;
};

export default function ComboBox({
  defaultValue,
  options,
  onValueChange,
}: ComboBoxProps) {
  const datalistID = useId();
  const inputID = useId();
  return (
    <div className="combo-box">
      <input
        id={inputID}
        list={datalistID}
        className="user-input"
        value={defaultValue}
        onChange={(e) => onValueChange(e.target.value)}
      />

      <span className="combo-box-arrow" />

      <datalist id={datalistID}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}
