import type { NotebookCoverStyle } from "@/types/Notebook";
import { NOTEBOOK_COVER_STYLES } from "@/components/NotebookCoverStyles/NotebookCoverStyles";
import { TemplateTile } from "./TemplateTile";
import { MIDDLE_REACH, getLoopedOffset } from "./TemplateCarouselLayout";
import "./TemplatePicker.css";

/**
 * The templates section of the notebooks page, where users can choose a template to create a new notebook.
 * Five covers face you in the middle, the rest are angled off to the sides
 */
export function TemplatePicker() {
  const coverStyles = Object.keys(
    NOTEBOOK_COVER_STYLES,
  ) as NotebookCoverStyle[];

  // The middle shows the first five covers until the arrows can move it
  const centerIndex = MIDDLE_REACH;

  return (
    <section className="user-notebooks-page-template-picker">
      <div
        className="user-notebooks-page-template-picker-carousel"
        style={{ "--cover-middle-reach": MIDDLE_REACH } as React.CSSProperties}
      >
        {coverStyles.map((coverStyle, index) => (
          <TemplateTile
            key={coverStyle}
            coverStyle={coverStyle}
            offset={getLoopedOffset(index, centerIndex, coverStyles.length)}
          />
        ))}
      </div>
    </section>
  );
}
