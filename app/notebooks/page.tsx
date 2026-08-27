import NotebooksPageHeader from "@/components/UserNotebooks/NotebooksPageHeader";
import NotebookPageTemplates from "@/components/UserNotebooks/NotebooksPageTemplates";
import NotebookLibrary from "@/components/UserNotebooks/NotebookLibrary";
import styles from "./NotebooksPage.module.css";

// The main page for the user's saved notebooks and creating new notebooks.
export default function NotebooksPage() {
  return (
    <div>
      <NotebooksPageHeader />
      <NotebookPageTemplates />
      <NotebookLibrary />
    </div>
  );
}
