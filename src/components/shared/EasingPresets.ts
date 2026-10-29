import { Easing } from "remotion";

/**
 * Centralized easing presets for the entire project.
 * Use these instead of raw bezier values to maintain visual consistency.
 */

// Enter animations: starts fast, decelerates into place
export const EASE_IN_FAST = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_BOUNCE = Easing.bezier(0.34, 1.56, 0.64, 1);

// Exit animations: starts slow, accelerates away
export const EASE_OUT_CUBIC = Easing.in(Easing.cubic);
export const EASE_OUT_EXPO = Easing.in(Easing.exp);

// Symmetric: balanced ease-in-out
export const EASE_INOUT = Easing.bezier(0.45, 0, 0.55, 1);
export const EASE_INOUT_CUBIC = Easing.inOut(Easing.cubic);

// Subtle: almost linear, for background elements
export const EASE_SUBTLE = Easing.bezier(0.4, 0, 0.6, 1);
