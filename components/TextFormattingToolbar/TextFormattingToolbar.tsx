import type { TextFormatState } from "@/types/textFormatting";
import { FONT_FAMILIES, FONT_SIZES } from "@/constants/textFormattingConstants";
import TextStyleToggleButton from "@/components/TextFormattingToolbar/TextStyleToggleButton";
import TextColorPicker from "@/components/TextFormattingToolbar/TextColorPicker";
import HighlighterColorPicker from "@/components/TextFormattingToolbar/HighlighterColorPicker";
import FontSizeChooser from "@/components/TextFormattingToolbar/TextFontSizeChooser";
import FontChooser from "@/components/TextFormattingToolbar/TextFontFamilyChooser";
import "./TextFormattingToolbar.css";
import { useState } from "react";
import type { TextFormattingToolbarPopover } from "@/types/textFormatting";

type TextFormattingToolbarProps = {
  textFormatState: TextFormatState;
  updateTextFormatState: (newState: TextFormatState) => void;
};

/**
 * A toolbar component that provides text formatting options for the editor.
 * It includes buttons for bold, italic, and underline styles, as well as color pickers for text and highlight colors.
 * Users can also select font family and font size from dropdowns.
 * The toolbar reflects the current state of the editor and updates the editor's formatting accordingly.
 */
export default function TextFormattingToolbar({
  textFormatState,
  updateTextFormatState,
}: TextFormattingToolbarProps) {
  const [currPopover, setCurrPopover] =
    useState<TextFormattingToolbarPopover>(null);

  return (
    <div className="text-formatting-toolbar">
      <TextStyleToggleButton
        styleType="Bold"
        active={textFormatState.isBold}
        onClick={() =>
          updateTextFormatState({
            ...textFormatState,
            isBold: !textFormatState.isBold,
          })
        }
      />

      <TextStyleToggleButton
        styleType="Italic"
        active={textFormatState.isItalic}
        onClick={() =>
          updateTextFormatState({
            ...textFormatState,
            isItalic: !textFormatState.isItalic,
          })
        }
      />

      <TextStyleToggleButton
        styleType="Underline"
        active={textFormatState.isUnderline}
        onClick={() =>
          updateTextFormatState({
            ...textFormatState,
            isUnderline: !textFormatState.isUnderline,
          })
        }
      />

      <TextColorPicker
        color={textFormatState.textColor}
        isOpen={currPopover === "textColor"}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onColorChange={(color) =>
          updateTextFormatState({ ...textFormatState, textColor: color })
        }
      />

      <HighlighterColorPicker
        color={textFormatState.highlightColor}
        isOpen={currPopover === "highlightColor"}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onColorChange={(color) =>
          updateTextFormatState({ ...textFormatState, highlightColor: color })
        }
      />

      <FontChooser
        font={textFormatState.fontFamily}
        fonts={FONT_FAMILIES}
        isOpen={currPopover === "fontFamily"}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onFontChange={(font) => {
          updateTextFormatState({ ...textFormatState, fontFamily: font });
        }}
      />

      <FontSizeChooser
        size={textFormatState.fontSize}
        fontOptions={FONT_SIZES}
        onSizeChange={(size) => {
          updateTextFormatState({ ...textFormatState, fontSize: size });
        }}
      />
    </div>
  );
}
