import type { Group, Vector3 } from "three";
import { COVER_MOVE_DURATION_MS } from "@/components/UserNotebooksPage/TemplateCarouselLayout";
import { easeInOutQuart } from "../EasingStep";

// Where a notebook is and how far it's turned
export type Pose = {
  position: Vector3;
  turn: number;
};

// One change over time, from where something was to where it's going
export type Change<T> = {
  from: T;
  to: T;
  startedAt: number;
};

// A change starting now
export function startChange<T>(from: T, to: T): Change<T> {
  return { from, to, startedAt: performance.now() };
}

// How far along a change is, from 0 to 1, eased
export function getEasedProgress(change: Change<unknown>): number {
  const progress =
    (performance.now() - change.startedAt) / COVER_MOVE_DURATION_MS;
  return easeInOutQuart(Math.min(1, progress));
}

export function getPose(group: Group): Pose {
  return { position: group.position.clone(), turn: group.rotation.y };
}

export function setPose(group: Group, pose: Pose) {
  group.position.copy(pose.position);
  group.rotation.y = pose.turn;
}
