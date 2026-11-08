import { describe, expect, test } from "vitest";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three";
import { setOpacity } from "@/components/3DScene/GroupOpacity";

// A notebook-like group with a part inside another part
function makeGroup() {
  const outer = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const inner = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  outer.add(inner);
  const group = new Group();
  group.add(outer);
  return { group, materials: [outer.material, inner.material] };
}

describe("setOpacity", () => {
  test("every part, inner ones too, takes the opacity", () => {
    const { group, materials } = makeGroup();

    setOpacity(group, 0.3);

    materials.forEach((material) => expect(material.opacity).toBe(0.3));
  });

  test("parts are see-through only while faded, and solid again at 1", () => {
    const { group, materials } = makeGroup();

    setOpacity(group, 0.5);
    materials.forEach((material) => expect(material.transparent).toBe(true));

    setOpacity(group, 1);
    materials.forEach((material) => expect(material.transparent).toBe(false));
  });

  test("a part is only redrawn from scratch when it turns see-through or solid", () => {
    const { group, materials } = makeGroup();

    setOpacity(group, 0.5);
    const versionAfterTurning = materials[0].version;
    setOpacity(group, 0.4);

    expect(materials[0].version).toBe(versionAfterTurning);
  });
});
