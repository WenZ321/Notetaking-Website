import type { ReactNode } from "react";

type BlockNodePreviewProps = {
  openEditor: () => void;
  className?: string;
  children: ReactNode;
};

export function BlockNodePreview({
  openEditor,
  className,
  children,
}: BlockNodePreviewProps) {
  return (
    <div className={className} onDoubleClick={openEditor}>
      {children}
    </div>
  );
}
