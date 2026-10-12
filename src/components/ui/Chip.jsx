/**
 * @param {Object} props
 * @param {'neutral' | 'copper' | 'verdigris' | 'ochre' | 'rust'} [props.variant='neutral']
 * @param {boolean} [props.hasDot=false]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
export function Chip({ variant = 'neutral', hasDot = false, children, className = '' }) {
  const variantStyles = {
    neutral: 'bg-[#EDE4D2] text-[var(--ink-soft)] border-[var(--border)]',
    copper: 'bg-[#F4E8E1] text-[var(--copper)] border-[#E2BEA8]',
    verdigris: 'bg-[#E3EEEB] text-[var(--verdigris)] border-[#A7CBC2]',
    ochre: 'bg-[#F9F0DF] text-[var(--ochre)] border-[#E9D29F]',
    rust: 'bg-[#F8E7E4] text-[var(--rust)] border-[#E7AEA5]',
  };

  const dotColors = {
    neutral: 'bg-[var(--tick)]',
    copper: 'bg-[var(--copper)]',
    verdigris: 'bg-[var(--verdigris)]',
    ochre: 'bg-[var(--ochre)]',
    rust: 'bg-[var(--rust)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border font-mono text-[11px] tracking-wider uppercase select-none ${
        variantStyles[variant] || variantStyles.neutral
      } ${className}`}
    >
      {hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || dotColors.neutral
          }`}
        />
      )}
      {children}
    </span>
  );
}
