import Page from "./Page";
import "./NotebookView.css";
import type { Editor } from "@tiptap/core";

type Props = {
  onActivate: (editor: Editor) => void;
};

export default function NotebookView({ onActivate }: Props) {
  const height = 1056;
  const width = 816;
  const scale = 0.75;

  return (
    <div className="notebook">
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
          <Page
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
          <Page
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
