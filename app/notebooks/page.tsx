import NotebooksPageHeader from "@/components/NotebooksPage/NotebooksPageHeader";
import NotebookPageTemplates from "@/components/NotebooksPage/NotebooksPageTemplates";
import NotebookLibrary from "@/components/NotebooksPage/NotebookLibrary";
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
