import NotebookPage from "./NotebookPage";
import "./NotebookView.css";
import type { Editor } from "@tiptap/core";

type Props = {
  onActivate: (editor: Editor) => void;
};

/**
 * The notebook view that shows a preview of the notebook pages two at a time
 */
export default function NotebookView({ onActivate }: Props) {
  const height = 1056;
  const width = 816;

  // Should scale to fit the page without scrolling
  const scale = 0.75;

  return (
    <div className="notebook-preview">
      <div
        className="page-preview"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <NotebookPage
            editable={false}
            height={height}
            width={width}
            onActivate={onActivate}
          />
        </div>
      </div>

      <div
        className="page-preview"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <NotebookPage
            editable={false}
            height={height}
            width={width}
            onActivate={onActivate}
          />
        </div>
      </div>
    </div>
  );
}
