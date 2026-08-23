import type { FontInfo } from "./DiagramBlockType";
import { fontFamilies, fontSizes } from "@/types/textFormatting";
import TextStyleToggleButton from "@/components/Toolbar/TextStyleToggleButton";
import FontSizeChooser from "@/components/Toolbar/FontSizeChooser";
import FontChooser from "@/components/Toolbar/FontChooser";
import ColorPicker from "@/components/Toolbar/ColorPicker";

type ShapeToolbarProps = {
  onFontChange: (fontInfo: FontInfo) => void;
  currFontInfo: FontInfo;
};

export default function DiagramBlockToolbar({
  onFontChange,
  currFontInfo,
}: ShapeToolbarProps) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
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
        fonts={fontFamilies}
        onFontChange={(font) => {
          onFontChange({
            ...currFontInfo,
            family: font,
          });
        }}
      />

      <FontSizeChooser
        defaultSize={currFontInfo.size}
        fontOptions={fontSizes}
        onSizeChange={(size) => {
          onFontChange({
            ...currFontInfo,
            size: size,
          });
        }}
      />

      <ColorPicker
        isHighlight={false}
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
