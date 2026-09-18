import type { MathLiveKey } from "./MathLiveKey";
import {
  OPEN_PAREN,
  CLOSE_PAREN,
  ABSOLUTE_VALUE,
  OPEN_BRACKET,
  CLOSE_BRACKET,
  SQRT,
  CUBE_ROOT,
  GREATER_EQUAL,
  X,
  SEVEN,
  EIGHT,
  NINE,
  FRACTION,
  EXPONENT_TEMPLATE,
  SUBSCRIPT_TEMPLATE,
  LESS_EQUAL,
  Y,
  FOUR,
  FIVE,
  SIX,
  DIVIDE,
  SUPERSCRIPT,
  MULTIPLY,
  GREATER_THAN,
  Z,
  ONE,
  TWO,
  THREE,
  MINUS,
  PLUS,
  DIVISION_SIGN,
  LESS_THAN,
  COMMA,
  ZERO,
  DECIMAL_POINT,
  PERCENT,
  SPACE,
  EQUALS,
} from "./MathLiveKey";
import { MathLiveActionKey, ABC } from "./MathLiveActionKey";

export type MathLiveKeyboardLayout = (MathLiveKey | MathLiveActionKey)[][];

// Default Keyboard Layout
export const DefaultLayout: MathLiveKeyboardLayout = [
  [
    OPEN_PAREN,
    CLOSE_PAREN,
    ABSOLUTE_VALUE,
    OPEN_BRACKET,
    CLOSE_BRACKET,
    SQRT,
    CUBE_ROOT,
    GREATER_EQUAL,
  ],
  [
    X,
    SEVEN,
    EIGHT,
    NINE,
    FRACTION,
    EXPONENT_TEMPLATE,
    SUBSCRIPT_TEMPLATE,
    LESS_EQUAL,
  ],
  [Y, FOUR, FIVE, SIX, DIVIDE, SUPERSCRIPT, MULTIPLY, GREATER_THAN],
  [Z, ONE, TWO, THREE, MINUS, PLUS, DIVISION_SIGN, LESS_THAN],
  [ABC, COMMA, ZERO, DECIMAL_POINT, PERCENT, SPACE, EQUALS],
];

// Temp Keyboard Layout - placeholder layout with no real layout designed
// yet, every key just inserts 0
export const TempLayout: MathLiveKeyboardLayout = [
  [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
  [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
  [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
  [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
  [ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO],
];
