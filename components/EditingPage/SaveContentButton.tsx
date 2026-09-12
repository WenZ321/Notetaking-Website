type SaveContentButtonProps = {
  savePageContent: () => void;
};

// Button that saves the current page content when clicked.
export function SaveContentButton({
  savePageContent,
}: SaveContentButtonProps) {
  return <button onClick={savePageContent}> Save </button>;
}
