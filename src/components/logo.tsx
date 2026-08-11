import { PALETTE } from '../ansi/palette';

// TheDraw logos: [rowText, colorPerCell[]][] — attribute nibbles index the
// DOS palette (fg = low nibble, bg = high). Shared by the header logotype
// and the picker grid tiles.
export type TdfRows = [string, number[]][];

export function TdfLine({ row }: { row: TdfRows[number] }) {
  const [s, colors] = row;
  const runs: { text: string; c: number }[] = [];
  for (let i = 0; i < s.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.c === colors[i]) last.text += s[i];
    else runs.push({ text: s[i], c: colors[i] });
  }
  return (
    <div>
      {runs.map((r, i) => {
        const fg = r.c & 15;
        const bg = (r.c >> 4) & 7;
        const blank = bg === 0 && r.text.trim() === '';
        return (
          <span
            key={i}
            style={blank ? undefined : { color: PALETTE[fg], background: bg ? PALETTE[bg] : undefined }}
          >
            {r.text}
          </span>
        );
      })}
    </div>
  );
}
