"use client";

import { isReducedMotion, setReducedMotion } from "./ReducedMotion";
import "./ReducedMotionSwitch.css";

// A testing switch for the reduced motion setting
export function ReducedMotionSwitch() {
  return (
    <label className="reduced-motion-switch">
      <input
        type="checkbox"
        // set once it's in the browser, since the server can't know the setting
        ref={(input) => {
          if (input) input.checked = isReducedMotion();
        }}
        onChange={(event) => setReducedMotion(event.target.checked)}
      />
      Reduced motion
    </label>
  );
}
