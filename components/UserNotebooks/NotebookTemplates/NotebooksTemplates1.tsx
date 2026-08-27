"use client";
import { useRouter } from "next/navigation";
import { createNotebook } from "@/data/notebookDB";
import "./NotebooksTemplates.css";

/**
 * A specific notebook template
 */
export default function NotebooksTemplates1() {
  const router = useRouter();

  // Makes sure to create the notebook before sending users to the site
  async function handleCreateNotebook() {
    const notebook = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      totalPages: 0,
      pages: [],
    };

    await createNotebook(notebook);

    // Same as Link navigation, but allows us to do computations before sending users to the page
    router.push(`/notebooks/${notebook.id}`);
  }

  return (
    <button className="notebooks-template" onClick={handleCreateNotebook} />
  );
}
