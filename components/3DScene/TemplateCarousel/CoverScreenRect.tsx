import type { RefObject } from "react";
import type { NotebookCoverStyle } from "@/types/Notebook";
import { useEffect } from "react";
import { Box3, Vector3 } from "three";
import { useThree } from "@react-three/fiber";

// Finds where a template's notebook is drawn on screen, or null when it
// isn't in the scene
export type ReadCoverScreenRect = (
  coverStyle: NotebookCoverStyle,
) => DOMRect | null;

type CoverScreenRectProps = {
  readRectRef: RefObject<ReadCoverScreenRect | null>;
};

// Gives the page a way to find a notebook's box on screen, so the new
// notebook popup can open from the notebook that was chosen. Draws nothing
export function CoverScreenRect({ readRectRef }: CoverScreenRectProps) {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    readRectRef.current = (coverStyle) => {
      const notebook = scene.getObjectByName(coverStyle);
      if (!notebook) return null;

      // the screen box around all 8 corners of the notebook's 3D box
      const box = new Box3().setFromObject(notebook);
      const canvas = gl.domElement.getBoundingClientRect();
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            // from -1 to 1 across the canvas, with y going up
            const spot = new Vector3(x, y, z).project(camera);
            const screenX = canvas.left + ((spot.x + 1) / 2) * canvas.width;
            const screenY = canvas.top + ((1 - spot.y) / 2) * canvas.height;
            left = Math.min(left, screenX);
            right = Math.max(right, screenX);
            top = Math.min(top, screenY);
            bottom = Math.max(bottom, screenY);
          }
        }
      }
      return new DOMRect(left, top, right - left, bottom - top);
    };

    return () => {
      readRectRef.current = null;
    };
  }, [camera, gl, scene, readRectRef]);

  return null;
}
