type SaveContentButtonProps = {
  savePageContent: () => void;
};

export function SaveContentButton({
  savePageContent,
}: SaveContentButtonProps) {
  return <button onClick={savePageContent}> Save </button>;
}
