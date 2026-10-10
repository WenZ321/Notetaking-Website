import type { ToolbarField, ToolbarFormatState } from "@/types/textFormatting";
import type { TextFormattingToolbarPopover } from "@/types/textFormatting";
import { FONT_FAMILIES, FONT_SIZES } from "@/constants/textFormattingConstants";
import { useState } from "react";
import { TextStyleToggleButton } from "@/components/TextFormattingToolbar/TextStyleToggleButton";
import { TextColorPicker } from "@/components/TextFormattingToolbar/TextColorPicker";
import { HighlighterColorPicker } from "@/components/TextFormattingToolbar/HighlighterColorPicker";
import { TextFontSizeChooser } from "@/components/TextFormattingToolbar/TextFontSizeChooser";
import { TextFontFamilyChooser } from "@/components/TextFormattingToolbar/TextFontFamilyChooser";
import "./TextFormattingToolbar.css";

type TextFormattingToolbarProps = {
  textFormatState: ToolbarFormatState; // settings the selection doesn't have are null and disabled
  updateTextFormatState: (newState: ToolbarFormatState) => void;
};

/**
 * A toolbar component that provides text formatting options for the editor.
 * It includes buttons for bold, italic, and underline styles, as well as color pickers for text and highlight colors.
 * Users can also select font family and font size from dropdowns.
 * The toolbar reflects the current state of the editor and updates the editor's formatting accordingly.
 */
export function TextFormattingToolbar({
  textFormatState,
  updateTextFormatState,
}: TextFormattingToolbarProps) {
  const [currPopover, setCurrPopover] =
    useState<TextFormattingToolbarPopover>(null);

  const isDisabled = (field: ToolbarField) => textFormatState[field] === null;

  // a disabled setting's popover stays closed
  const isPopoverOpen = (
    popover: TextFormattingToolbarPopover & ToolbarField,
  ) => currPopover === popover && !isDisabled(popover);

  return (
    <div className="text-formatting-toolbar">
      <TextStyleToggleButton
        styleType="Bold"
        active={textFormatState.isBold ?? false}
        disabled={isDisabled("isBold")}
        onClick={() =>
          updateTextFormatState({
            ...textFormatState,
            isBold: !textFormatState.isBold,
          })
        }
      />

      <TextStyleToggleButton
        styleType="Italic"
        active={textFormatState.isItalic ?? false}
        disabled={isDisabled("isItalic")}
        onClick={() =>
          updateTextFormatState({
            ...textFormatState,
            isItalic: !textFormatState.isItalic,
          })
        }
      />

      <TextStyleToggleButton
        styleType="Underline"
        active={textFormatState.isUnderline ?? false}
        disabled={isDisabled("isUnderline")}
        onClick={() =>
          updateTextFormatState({
            ...textFormatState,
            isUnderline: !textFormatState.isUnderline,
          })
        }
      />

      <TextColorPicker
        color={textFormatState.textColor ?? ""}
        isOpen={isPopoverOpen("textColor")}
        disabled={isDisabled("textColor")}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onColorChange={(color) =>
          updateTextFormatState({ ...textFormatState, textColor: color })
        }
      />

      <HighlighterColorPicker
        color={textFormatState.highlightColor ?? ""}
        isOpen={isPopoverOpen("highlightColor")}
        disabled={isDisabled("highlightColor")}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onColorChange={(color) =>
          updateTextFormatState({ ...textFormatState, highlightColor: color })
        }
      />

      <TextFontFamilyChooser
        font={textFormatState.fontFamily ?? ""}
        fonts={FONT_FAMILIES}
        isOpen={isPopoverOpen("fontFamily")}
        disabled={isDisabled("fontFamily")}
        onTogglePopover={(popover) => setCurrPopover(popover)}
        onFontChange={(font) => {
          updateTextFormatState({ ...textFormatState, fontFamily: font });
        }}
      />

      <TextFontSizeChooser
        size={textFormatState.fontSize}
        fontOptions={FONT_SIZES}
        disabled={isDisabled("fontSize")}
        onSizeChange={(size) => {
          updateTextFormatState({ ...textFormatState, fontSize: size });
        }}
      />
    </div>
  );
}
