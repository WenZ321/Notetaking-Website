import { Cannabis } from "lucide-react";
import Link from "next/link";
import "./LogoLink.css";

/**
 * The logo of the website that links back to the home page/notebooks page
 */
export default function LogoLink() {
  return (
    <Link href="/" className="logo-link">
      <Cannabis className="logo" />
    </Link>
  );
}
