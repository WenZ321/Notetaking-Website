import type { ReactNode } from "react";

type TiptapNodePreviewProps = {
  openEditor: () => void;
  className?: string;
  children: ReactNode;
};

export function TiptapNodePreview({
  openEditor,
  className,
  children,
}: TiptapNodePreviewProps) {
  return (
    <div className={className} onDoubleClick={openEditor}>
      {children}
    </div>
  );
}
