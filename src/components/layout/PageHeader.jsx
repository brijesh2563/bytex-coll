/**
 * PageHeader
 * Reusable consistent main content frame header.
 * 
 * Hierarchy:
 * Breadcrumb
 * ↓
 * Page Heading + contextual badge
 * ↓
 * Short human-readable description
 * ↓
 * Optional page-level action
 * ↓
 * Divider
 */
export function PageHeader({
  breadcrumbs = ['Workspace'],
  title,
  badge = null,
  description = null,
  action = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-2.5 pb-5 border-b border-[#DCE5E1] mb-6 ${className}`}>
      {/* 1. BREADCRUMB */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-sans text-xs text-[#697775]">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-[#DCE5E1] select-none">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-[#15201F] font-medium'
                    : 'text-[#697775] hover:text-[#176D70] transition-colors'
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}

      {/* 2. PAGE HEADING + CONTEXTUAL BADGE + PAGE-LEVEL ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#15201F]">
            {title}
          </h1>
          {badge}
        </div>

        {action && (
          <div className="flex items-center gap-2 shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* 3. SHORT HUMAN-READABLE DESCRIPTION */}
      {description && (
        <p className="font-sans text-sm text-[#697775] max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
