import { Cannabis } from "lucide-react";
import Link from "next/link";
import "./LogoLink.css";

export default function LogoLink() {
  return (
    <Link href="/" className="logo-link">
      <Cannabis className="logo" />
    </Link>
  );
}
