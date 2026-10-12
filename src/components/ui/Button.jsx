/**
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.isPill=false]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 * @param {boolean} [props.disabled=false]
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} [props.rest]
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isPill = false,
  children,
  className = '',
  disabled = false,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center font-medium font-sans transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--copper)] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[var(--copper)] text-[var(--paper-raised)] border border-[var(--copper)] hover:bg-[var(--copper-deep)] hover:border-[var(--copper-deep)] active:translate-y-[1px]',
    secondary:
      'bg-[var(--paper-raised)] text-[var(--ink)] border border-[var(--border)] hover:border-[var(--dial-ring)] hover:bg-[#F3ECE0] active:translate-y-[1px]',
    ghost:
      'bg-transparent text-[var(--ink-soft)] border border-transparent hover:text-[var(--ink)] hover:bg-[#EFE8DA]',
    danger:
      'bg-[var(--rust)] text-[var(--paper-raised)] border border-[var(--rust)] hover:opacity-90 active:translate-y-[1px]',
  };

  const radius = isPill ? 'rounded-full' : 'rounded-[4px]';

  return (
    <button
      className={`${base} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${radius} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
