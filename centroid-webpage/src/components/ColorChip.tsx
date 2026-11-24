interface Props {
  hex: string; // "RRGGBB" or "#RRGGBB"
  bold?: boolean;
}

// A small color square followed by its hex code, e.g. ■ 660005
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
