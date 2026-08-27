import LogoLink from "../LogoLink";
import "./NotebooksPageHeader.css";

/**
 * Header of the notebooks page
 */
export default function NotebooksPageHeader() {
  // Should add search bar and account info
  return (
    <div className="notebooks-page-header">
      <LogoLink pageLink="/" />
    </div>
  );
}
