/**
 * @param {Object} props
 * @param {boolean} props.checked
 * @param {(checked: boolean) => void} props.onChange
 * @param {string} [props.label='']
 * @param {string} [props.className='']
 * @param {boolean} [props.disabled=false]
 */
export function Switch({ checked, onChange, label, className = '', disabled = false }) {
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[var(--copper)] focus-visible:outline-offset-2 ${
          checked
            ? 'bg-[var(--copper)] border-[var(--copper)]'
            : 'bg-[#DDD1B8] border-[var(--line)]'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[var(--paper-raised)] shadow-xs transition-transform duration-200 ease-out ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && (
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink)]">
          {label}
        </span>
      )}
    </label>
  );
}
