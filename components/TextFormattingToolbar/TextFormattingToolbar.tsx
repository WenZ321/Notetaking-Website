import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { fontFamilies, fontSizes } from "@/constants/textFormattingConstants";
import TextStyleToggleButton from "@/components/TextFormattingToolbar/TextStyleToggleButton";
import TextColorPicker from "@/components/TextFormattingToolbar/TextColorPicker";
import HighlighterColorPicker from "@/components/TextFormattingToolbar/HighlighterColorPicker";
import FontSizeChooser from "@/components/TextFormattingToolbar/TextFontSizeChooser";
import FontChooser from "@/components/TextFormattingToolbar/TextFontFamilyChooser";
import "./TextFormattingToolbar.css";

type TextFormattingToolbarProps = {
  editor: Editor | null;
};

/**
 * A toolbar component that provides text formatting options for the editor.
 * It includes buttons for bold, italic, and underline styles, as well as color pickers for text and highlight colors.
 * Users can also select font family and font size from dropdowns.
 * The toolbar reflects the current state of the editor and updates the editor's formatting accordingly.
 */
export default function TextFormattingToolbar({
  editor,
}: TextFormattingToolbarProps) {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isItalic: editor?.isActive("italic") ?? false,
      isBold: editor?.isActive("bold") ?? false,
      isUnderline: editor?.isActive("underline") ?? false,
      fontFamily: editor?.getAttributes("textStyle").fontFamily ?? "Arial",
      fontSize: editor?.getAttributes("textStyle").fontSize ?? "12px",
      textColor: editor?.getAttributes("textStyle").color ?? "#000000",
      highlightColor: editor?.getAttributes("highlight").color ?? "",
    }),
  });

  return (
    <div className="text-formatting-toolbar">
      <TextStyleToggleButton
        styleType="Bold"
        active={editorState?.isBold ?? false}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      />

      <TextStyleToggleButton
        styleType="Italic"
        active={editorState?.isItalic ?? false}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      />

      <TextStyleToggleButton
        styleType="Underline"
        active={editorState?.isUnderline ?? false}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
      />

      <TextColorPicker
        defaultColor={editorState?.textColor}
        onColorChange={(color) => editor?.chain().focus().setColor(color).run()}
      />
      <HighlighterColorPicker
        defaultColor={editorState?.highlightColor}
        onColorChange={(color) =>
          editor?.chain().focus().setHighlight({ color }).run()
        }
      />

      <FontChooser
        defaultFont={editorState?.fontFamily}
        fonts={fontFamilies}
        onFontChange={(font) => {
          editor?.chain().focus().setFontFamily(font).run();
        }}
      />

      <FontSizeChooser
        defaultSize={12}
        fontOptions={fontSizes}
        onSizeChange={(size) => {
          editor?.chain().setFontSize(`${size}px`).run();
        }}
      />
    </div>
  );
}
