import { Cannabis } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";
import LogoLink from "@/components/LogoLink";

// Marketing/home page to convince users to sign up

export default function Home() {
  return (
    <div className={styles["menu-bar"]}>
      <LogoLink />

      <Link href="/notebooks" className="links">
        Notebooks
      </Link>
    </div>
  );
}
