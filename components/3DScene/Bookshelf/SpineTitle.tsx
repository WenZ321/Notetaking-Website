import { Text } from "@react-three/drei";
import { NOTEBOOK_WIDTH } from "../NotebookModel/NotebookLook";
import { SPINE_TITLE_FONT, SPINE_TITLE_LENGTH } from "./BookshelfLook";
import { fitSpineTitle, getSpineTitleColor } from "./SpineTitleFit";

type SpineTitleProps = {
  title: string;
  spineColor: string;
};

// Faces the same way as the spine, far enough in front of it that the two
// don't flicker into each other from far away, and turned to read top to
// bottom
const SPINE_FACE_X = -NOTEBOOK_WIDTH / 2 - 0.008;
const FACE_SPINE_TURN = -Math.PI / 2;
const TOP_TO_BOTTOM_TURN = -Math.PI / 2;

// A notebook's title written along its spine. Sits inside the notebook's
// own group, so it moves with the notebook
export function SpineTitle({ title, spineColor }: SpineTitleProps) {
  const { text, size } = fitSpineTitle(title);

  return (
    <Text
      font={SPINE_TITLE_FONT}
      fontSize={size}
      color={getSpineTitleColor(spineColor)}
      anchorX="center"
      anchorY="middle"
      whiteSpace="nowrap"
      // never draws past the spine's ends, even if a title came out wider
      // than the fit expected
      clipRect={[
        -SPINE_TITLE_LENGTH / 2,
        -size,
        SPINE_TITLE_LENGTH / 2,
        size,
      ]}
      position={[SPINE_FACE_X, 0, 0]}
      rotation={[0, FACE_SPINE_TURN, TOP_TO_BOTTOM_TURN]}
    >
      {text}
    </Text>
  );
}
