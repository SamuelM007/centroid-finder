interface Props {
  /** The color, as `"RRGGBB"` or `"#RRGGBB"`. */
  hex: string;
  /** Show the hex code in bold. Default false. */
  bold?: boolean;
}

/**
 * A small color square followed by its hex code, e.g. ■ 660005.
 * Used for a job's target color on the Jobs table and the results page.
 */
const ColorChip = ({ hex, bold = false }: Props) => {
  const plain = hex.replace('#', '').toUpperCase();
  return (
    <span className="meta-item">
      <span className="color-chip" style={{ background: `#${plain}` }} aria-hidden="true" />
      <span className={bold ? 'mono strong' : 'mono'}>{plain}</span>
    </span>
  );
};

export default ColorChip;
