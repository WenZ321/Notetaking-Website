import type { FontInfo } from "./DiagramBlockType";
import { FONT_FAMILIES, FONT_SIZES } from "@/constants/textFormattingConstants";
import TextStyleToggleButton from "@/components/TextFormattingToolbar/TextStyleToggleButton";
import FontSizeChooser from "@/components/TextFormattingToolbar/TextFontSizeChooser";
import FontChooser from "@/components/TextFormattingToolbar/TextFontFamilyChooser";
import TextColorPicker from "@/components/TextFormattingToolbar/TextColorPicker";
import "./DiagramBlockTextFormattingToolbar.css";

type ShapeToolbarProps = {
  onFontChange: (fontInfo: FontInfo) => void;
  currFontInfo: FontInfo;
};

export default function DiagramBlockTextFormattingToolbar({
  onFontChange,
  currFontInfo,
}: ShapeToolbarProps) {
  return (
    <div className="diagram-block-text-formatting-toolbar">
      <TextStyleToggleButton
        styleType={"Bold"}
        active={currFontInfo.bold}
        onClick={() =>
          onFontChange({
            ...currFontInfo,
            bold: !currFontInfo.bold,
          })
        }
      />

      <TextStyleToggleButton
        styleType={"Italic"}
        active={currFontInfo.italic}
        onClick={() =>
          onFontChange({
            ...currFontInfo,
            italic: !currFontInfo.italic,
          })
        }
      />

      <TextStyleToggleButton
        styleType={"Underline"}
        active={currFontInfo.underline}
        onClick={() =>
          onFontChange({
            ...currFontInfo,
            underline: !currFontInfo.underline,
          })
        }
      />

      <FontChooser
        defaultFont={currFontInfo.family}
        fonts={FONT_FAMILIES}
        onFontChange={(font) => {
          onFontChange({
            ...currFontInfo,
            family: font,
          });
        }}
      />

      <FontSizeChooser
        defaultSize={currFontInfo.size}
        fontOptions={FONT_SIZES}
        onSizeChange={(size) => {
          onFontChange({
            ...currFontInfo,
            size: size,
          });
        }}
      />

      <TextColorPicker
        defaultColor={currFontInfo.color}
        onColorChange={(color) =>
          onFontChange({
            ...currFontInfo,
            color: color,
          })
        }
      />
    </div>
  );
}
