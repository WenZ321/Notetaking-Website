"use client";
import { useRouter } from "next/navigation";
import { saveNotebook } from "@/data/notebookDB";
import "./NotebooksTemplates.css";

export default function NotebooksTemplates1() {
  const router = useRouter();

  async function handleCreateNotebook() {
    const notebook = {
      id: crypto.randomUUID(),
      title: "Untitled Notebook",
      pages: [],
    };

    await saveNotebook(notebook);

    router.push(`/notebooks/${notebook.id}`);
  }

  return (
    <button className="notebooks-template" onClick={handleCreateNotebook} />
  );
}
