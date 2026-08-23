import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { fontFamilies, fontSizes } from "@/types/textFormatting";
import TextStyleToggleButton from "@/components/Toolbar/TextStyleToggleButton";
import ColorPicker from "@/components/Toolbar/ColorPicker";
import FontSizeChooser from "@/components/Toolbar/FontSizeChooser";
import "./Toolbar.css";
import FontChooser from "@/components/Toolbar/FontChooser";

type Props = {
  editor: Editor | null;
};

export default function Toolbar({ editor }: Props) {
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
    <div className="toolbar">
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

      <ColorPicker
        isHighlight={false}
        defaultColor={editorState?.textColor}
        onColorChange={(color) => editor?.chain().focus().setColor(color).run()}
      />
      <ColorPicker
        isHighlight={true}
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
