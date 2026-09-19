import type { ReactNode } from "react";

type TiptapNodePreviewProps = {
  openEditor: () => void;
  className?: string;
  children: ReactNode;
  tag?: "div" | "span"; // "span" for inline nodes - a <div> would break the line
};

export function TiptapNodePreview({
  openEditor,
  className,
  children,
  tag: Tag = "div",
}: TiptapNodePreviewProps) {
  return (
    <Tag className={className} onDoubleClick={openEditor}>
      {children}
    </Tag>
  );
}
