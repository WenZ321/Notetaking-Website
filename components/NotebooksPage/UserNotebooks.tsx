"use client";

import { useEffect, useState } from "react";
import { getNotebooks } from "@/data/notebookDB";
import Notebook from "./Notebook";

export default function UserNotebooks() {
  const [notebooks, setNotebooks] = useState<any[]>([]);

  useEffect(() => {
    async function loadNotebooks() {
      const savedNotebooks = await getNotebooks();
      setNotebooks(savedNotebooks);
    }

    loadNotebooks();
  }, []);

  return (
    <div className="notebooks-containter">
      {notebooks.map((notebook) => (
        <Notebook key={notebook.id} title={notebook.title} id={notebook.id} />
      ))}
    </div>
  );
}
