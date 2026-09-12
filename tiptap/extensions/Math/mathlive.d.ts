import type { MathfieldElement } from "mathlive";

// Lets JSX recognize the <math-field> custom element from mathlive.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}
