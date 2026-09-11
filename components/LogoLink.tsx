import { Cannabis } from "lucide-react";
import Link from "next/link";
import "./LogoLink.css";

type LogoLinkProps = {
  pageLink: string;
  onClick?: () => void;
};

/**
 * The logo of the website that links back to the home page/notebooks page
 */
export function LogoLink({ pageLink, onClick }: LogoLinkProps) {
  return (
    <Link href={pageLink} className="logo-link" onClick={onClick}>
      <Cannabis className="logo" />
    </Link>
  );
}
