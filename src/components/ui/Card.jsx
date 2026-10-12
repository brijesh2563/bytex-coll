/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 * @param {string} [props.caption='']
 * @param {string} [props.figure='']
 */
export function Card({ children, className = '', caption, figure, ...rest }) {
  return (
    <div
      className={`bg-[var(--paper-raised)] border border-[var(--border)] rounded-[10px] p-4 sm:p-5 relative transition-colors ${className}`}
      {...rest}
    >
      {(figure || caption) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--line)] font-mono text-[11px] text-[var(--ink-soft)] uppercase tracking-wider">
          {figure && <span className="font-semibold text-[var(--ink)]">{figure}</span>}
          {caption && <span className="text-[var(--ink-faint)] italic lowercase">{caption}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
