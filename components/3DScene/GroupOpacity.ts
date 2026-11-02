import type { Group, Material, Mesh } from "three";

// Sets how see-through every part of a group is, 1 being solid. Parts are
// only drawn see-through while they fade, since inner parts show through
// see-through ones
export function setOpacity(group: Group, opacity: number) {
  const isSeeThrough = opacity < 1;
  group.traverse((object) => {
    const material = (object as Mesh).material as Material | undefined;
    if (!material) return;
    if (material.transparent !== isSeeThrough) {
      material.transparent = isSeeThrough;
      material.needsUpdate = true;
    }
    material.opacity = opacity;
  });
}
