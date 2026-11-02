import { NotebooksPageHeader } from "@/components/UserNotebooksPage/NotebooksPageHeader";
import { TemplatePicker } from "@/components/UserNotebooksPage/TemplatePicker";
import { NotebookLibrary } from "@/components/UserNotebooksPage/NotebookLibrary";
import { CreatingNotebookProvider } from "@/components/UserNotebooksPage/CreatingNotebook";
import styles from "./NotebooksPage.module.css";

// The main page for the user's saved notebooks and creating new notebooks.
export default function NotebooksPage() {
  return (
    <div className={styles.page}>
      <NotebooksPageHeader />
      <CreatingNotebookProvider>
        <TemplatePicker />
        <NotebookLibrary />
      </CreatingNotebookProvider>
    </div>
  );
}
