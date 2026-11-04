import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import "./LogoLink.css";

type LogoLinkProps = {
  pageLink: string;
  onClick?: () => void;
};

/**
 * The logo of the website that links back to the home page/notebooks page.
 * Every page has one, and the same name tells page changes it's the same
 * logo, so it stays still while the rest of the page crossfades
 */
export function LogoLink({ pageLink, onClick }: LogoLinkProps) {
  return (
    <ViewTransition name="site-logo">
      <Link href={pageLink} className="logo-link" onClick={onClick}>
        <Image
          src="/brand/erimere-mark.svg"
          alt="Erimere"
          width={48}
          height={48}
          className="logo"
        />
      </Link>
    </ViewTransition>
  );
}
