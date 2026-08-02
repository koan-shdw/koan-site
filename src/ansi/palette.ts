/** DOS/VGA 16-color palette, classic DOS ordering (iCE colors: any of the 16
    usable as fg AND bg). Keep in sync with tools/img2ansi.mjs. */
export const PALETTE = [
  '#000000', // 0 black
  '#0000aa', // 1 blue
  '#00aa00', // 2 green
  '#00aaaa', // 3 cyan
  '#aa0000', // 4 red
  '#aa00aa', // 5 magenta
  '#aa5500', // 6 brown
  '#aaaaaa', // 7 light gray
  '#555555', // 8 dark gray
  '#5555ff', // 9 light blue
  '#55ff55', // 10 light green
  '#55ffff', // 11 light cyan
  '#ff5555', // 12 light red
  '#ff55ff', // 13 light magenta
  '#ffff55', // 14 yellow
  '#ffffff', // 15 white
] as const;
