// Attrs shape shared by the math node types.
export type MathAttrs = {
    latex: string;
}

// Math blocks are resizable, so they also carry a pixel size
export type MathBlockAttrs = MathAttrs & {
    width: number;
    height: number;
}
