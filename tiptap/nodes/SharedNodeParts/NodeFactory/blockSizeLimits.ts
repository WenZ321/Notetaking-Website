// Narrowest a block can be, when inserted or resized
export const MIN_BLOCK_WIDTH = 150;

// Shortest a block can be inserted at, about one line of text. Once on the
// page, a block's content sets its own min height for resizing
export const MIN_BLOCK_HEIGHT = 24;

// Widest and tallest a block can be, set in each block's options
export type MaxBlockSize = {
  maxWidth: number;
  maxHeight: number;
};
