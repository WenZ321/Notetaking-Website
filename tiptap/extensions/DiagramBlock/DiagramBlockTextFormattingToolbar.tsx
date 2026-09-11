import type { FontInfo } from "./DiagramBlockType";
import type { TextFormattingToolbarPopover } from "@/types/textFormatting";
import { FONT_FAMILIES, FONT_SIZES } from "@/constants/textFormattingConstants";
import { TextStyleToggleButton } from "@/components/TextFormattingToolbar/TextStyleToggleButton";
import { TextFontSizeChooser } from "@/components/TextFormattingToolbar/TextFontSizeChooser";
import { TextFontFamilyChooser } from "@/components/TextFormattingToolbar/TextFontFamilyChooser";
import { TextColorPicker } from "@/components/TextFormattingToolbar/TextColorPicker";
import "./DiagramBlockTextFormattingToolbar.css";
import { useState } from "react";

type ShapeToolbarProps = {
  onFontChange: (fontInfo: FontInfo) => void;
  currFontInfo: FontInfo;
};

export function DiagramBlockTextFormattingToolbar({
  onFontChange,
  currFontInfo,
}: ShapeToolbarProps) {
  const [currPopover, setCurrPopover] =
    useState<TextFormattingToolbarPopover>(null);

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

      <TextFontFamilyChooser
        font={currFontInfo.family}
        fonts={FONT_FAMILIES}
        isOpen={currPopover === "fontFamily"}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onFontChange={(font) => {
          onFontChange({
            ...currFontInfo,
            family: font,
          });
        }}
      />

      <TextFontSizeChooser
        size={currFontInfo.size}
        fontOptions={FONT_SIZES}
        onSizeChange={(size) => {
          onFontChange({
            ...currFontInfo,
            size: size,
          });
        }}
      />

      <TextColorPicker
        color={currFontInfo.color}
        isOpen={currPopover === "textColor"}
        onTogglePopover={(popover) => setCurrPopover(popover)}
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
