import { Cannabis } from "lucide-react";
import Link from "next/link";
import "./LogoLink.css";

type LogoLinkProps = {
  pageLink: string;
};

/**
 * The logo of the website that links back to the home page/notebooks page
 */
export default function LogoLink({ pageLink }: LogoLinkProps) {
  return (
    <Link href={pageLink} className="logo-link">
      <Cannabis className="logo" />
    </Link>
  );
}
