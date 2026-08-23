import NotebooksPageHeader from "@/components/NotebooksPage/NotebooksPageHeader";
import NotebookPageTemplates from "@/components/NotebooksPage/NotebooksPageTemplates";
import UserNotebooks from "@/components/NotebooksPage/UserNotebooks";

export default function NotebooksPage() {
  return (
    <div>
      <NotebooksPageHeader />
      <NotebookPageTemplates />
      <UserNotebooks />
    </div>
  );
}
