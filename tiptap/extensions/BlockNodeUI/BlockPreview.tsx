import type { ReactNode } from "react";

type BlockPreviewProps = {
  openEditor: () => void;
  className?: string;
  children: ReactNode;
};

export function BlockPreview({
  openEditor,
  className,
  children,
}: BlockPreviewProps) {
  return (
    <div className={className} onDoubleClick={openEditor}>
      {children}
    </div>
  );
}
