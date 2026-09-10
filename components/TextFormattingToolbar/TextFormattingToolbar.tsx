import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import type { TextFormatState } from "@/types/textFormatting";
import { FONT_FAMILIES, FONT_SIZES } from "@/constants/textFormattingConstants";
import TextStyleToggleButton from "@/components/TextFormattingToolbar/TextStyleToggleButton";
import TextColorPicker from "@/components/TextFormattingToolbar/TextColorPicker";
import HighlighterColorPicker from "@/components/TextFormattingToolbar/HighlighterColorPicker";
import FontSizeChooser from "@/components/TextFormattingToolbar/TextFontSizeChooser";
import FontChooser from "@/components/TextFormattingToolbar/TextFontFamilyChooser";
import "./TextFormattingToolbar.css";

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
        onColorChange={(color) =>
          updateTextFormatState({ ...textFormatState, textColor: color })
        }
      />

      <HighlighterColorPicker
        color={textFormatState.highlightColor}
        onColorChange={(color) =>
          updateTextFormatState({ ...textFormatState, highlightColor: color })
        }
      />

      <FontChooser
        defaultFont={textFormatState.fontFamily}
        fonts={FONT_FAMILIES}
        onFontChange={(font) => {
          updateTextFormatState({ ...textFormatState, fontFamily: font });
        }}
      />

      <FontSizeChooser
        defaultSize={12}
        fontOptions={FONT_SIZES}
        onSizeChange={(size) => {
          updateTextFormatState({ ...textFormatState, fontSize: size });
        }}
      />
    </div>
  );
}
