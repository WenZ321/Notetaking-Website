type SaveContentButtonProps = {
  savePageContent: () => void;
};

export default function SaveContentButton({
  savePageContent,
}: SaveContentButtonProps) {
  return <button onClick={savePageContent}> Save </button>;
}
