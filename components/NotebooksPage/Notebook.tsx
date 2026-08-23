import Link from "next/link";
import "./Notebook.css";

type NotebookProps = {
  title: string;
  id: string;
};

export default function Notebook({ title, id }: NotebookProps) {
  return (
    <Link href={`/notebooks/${id}`} className="notebook-link">
      <div className="notebook">
        <h3>{title}</h3>
      </div>
    </Link>
  );
}
