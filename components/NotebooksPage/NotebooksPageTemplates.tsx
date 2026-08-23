import "./NotebooksPageTemplates.css";
import NotebookTemplates1 from "./NotebookTemplates/NotebooksTemplates1";

export default function NotebookPageTemplates() {
  return (
    <section className="templates-section">
      <div className="templates-container">
        <NotebookTemplates1 />
        <NotebookTemplates1 />
        <NotebookTemplates1 />
        <NotebookTemplates1 />
      </div>
    </section>
  );
}
