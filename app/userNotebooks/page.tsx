import { NotebooksPageHeader } from "@/components/UserNotebooksPage/NotebooksPageHeader";
import { NotebookPageTemplates } from "@/components/UserNotebooksPage/NotebooksPageTemplates";
import { NotebookLibrary } from "@/components/UserNotebooksPage/NotebookLibrary";
import styles from "./NotebooksPage.module.css";

// The main page for the user's saved notebooks and creating new notebooks.
export default function NotebooksPage() {
  return (
    <div className={styles.page}>
      <NotebooksPageHeader />
      <NotebookPageTemplates />
      <NotebookLibrary />
    </div>
  );
}
