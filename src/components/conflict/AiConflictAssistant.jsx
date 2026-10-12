import { useState } from 'react';
import {
  isAiServiceConfigured,
  extractConflictContext,
  requestConflictExplanation,
} from '../../core/aiConflictService';
import {
  Sparkles,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';

/**
 * Purposeful AI Conflict Assistant.
 * 
 * Provides an advisory explanation to help a normal user understand what changed
 * and what each choice could affect before making an informed manual resolution.
 * 
 * Core Invariant:
 * - AI is STRICTLY advisory. It never automatically chooses branches or commits joins.
 * - Convergence is verified solely by real CRDT join-semilattice logic.
 * - Truthfully reports connection state without fabricating synthetic AI outputs.
 * 
 * @param {Object} props
 * @param {Object} props.conflict - Active conflict descriptor
 * @param {string} [props.className] - Optional custom CSS classes
 */
export function AiConflictAssistant({ conflict, className = '' }) {
  const isConfigured = isAiServiceConfigured();

  // State: 'NOT_CONNECTED' | 'READY' | 'ANALYZING' | 'RESULT' | 'ERROR'
  const [aiState, setAiState] = useState(() => {
    return isConfigured ? 'READY' : 'NOT_CONNECTED';
  });

  const [explanationData, setExplanationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Synchronize state when target conflict changes without cascading effects
  const [prevConflictId, setPrevConflictId] = useState(conflict?.id);
  if (conflict?.id !== prevConflictId) {
    setPrevConflictId(conflict?.id);
    setAiState(isConfigured ? 'READY' : 'NOT_CONNECTED');
    setExplanationData(null);
    setErrorMessage(null);
  }

  const handleExplain = async () => {
    if (!conflict) return;

    if (!isConfigured) {
      setAiState('NOT_CONNECTED');
      return;
    }

    setAiState('ANALYZING');
    setErrorMessage(null);

    const context = extractConflictContext(conflict);
    const result = await requestConflictExplanation(context);

    if (result.status === 'RESULT') {
      setExplanationData(result.data);
      setAiState('RESULT');
    } else if (result.status === 'NOT_CONNECTED') {
      setAiState('NOT_CONNECTED');
    } else {
      setErrorMessage(
        result.message ||
          'AI assistance is temporarily unavailable. You can still resolve this conflict manually.'
      );
      setAiState('ERROR');
    }
  };

  if (!conflict) return null;

  return (
    <div
      className={`rounded-xl bg-[var(--paper-raised)] border border-[var(--border)] p-5 sm:p-6 shadow-xs space-y-4 transition-colors duration-200 ${className}`}
      aria-label="AI Conflict Assistant"
    >
      {/* 1. HEADER SECTION (Standardized User-Facing Heading & Supporting Text) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--verdigris)]" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--verdigris)] font-bold">
              CONVERGENCE ADVISOR · NON-AUTHORITATIVE
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl text-[var(--ink)] font-semibold tracking-tight flex items-center gap-2">
            <span>AI Conflict Assistant</span>
          </h3>

          <p className="font-newsreader text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
            Understand what changed and what each choice could affect.
          </p>
        </div>

        {/* Status Pill Badge */}
        <div className="self-start sm:self-auto shrink-0 font-mono text-[10px] uppercase font-bold tracking-wider">
          {aiState === 'NOT_CONNECTED' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--paper)] border border-[var(--border)] text-[var(--ink-faint)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink-faint)]" />
              STATUS: NOT CONNECTED
            </span>
          )}

          {aiState === 'READY' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--copper)]/10 border border-[var(--copper)]/30 text-[var(--copper)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
              STATUS: READY
            </span>
          )}

          {aiState === 'ANALYZING' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--ochre)]/15 border border-[var(--ochre)]/40 text-[var(--ochre)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ochre)] animate-ping" />
              ANALYZING CONFLICT...
            </span>
          )}

          {aiState === 'RESULT' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--verdigris)]/15 border border-[var(--verdigris)]/30 text-[var(--verdigris)]">
              <ShieldCheck className="w-3 h-3" />
              ADVISORY SUGGESTION
            </span>
          )}

          {aiState === 'ERROR' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--rust)]/15 border border-[var(--rust)]/30 text-[var(--rust)]">
              <AlertCircle className="w-3 h-3" />
              TEMPORARILY UNAVAILABLE
            </span>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT ACCORDING TO AUTHENTIC STATE */}

      {/* STATE A: NOT CONNECTED (Default honest state when no backend endpoint is configured) */}
      {aiState === 'NOT_CONNECTED' && (
        <div className="p-4 rounded-lg bg-[var(--paper)] border border-[var(--border)] space-y-3">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[var(--ink-soft)] shrink-0 mt-0.5" />
            <div className="space-y-1 font-newsreader text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              <p className="font-semibold text-[var(--ink)] font-display text-sm">
                AI assistance is not connected yet.
              </p>
              <p>
                A secure server-side AI provider has not been configured for this cluster. NexusSync protects your credentials by never storing provider API keys in browser storage.
              </p>
              <p className="text-[var(--ink-faint)] text-xs pt-0.5">
                You can resolve this conflict manually with 100% mathematical certainty using the strategy controls below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--line)] font-mono text-[11px] text-[var(--ink-faint)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[var(--copper)]" />
              ZERO CREDENTIALS STORED IN BROWSER
            </span>
            <span>MANUAL RESOLVER FULLY ACTIVE</span>
          </div>
        </div>
      )}

      {/* STATE B: READY (When endpoint is connected and ready to explain) */}
      {aiState === 'READY' && (
        <div className="p-4 rounded-lg bg-[var(--paper)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase text-[var(--ink-faint)] font-bold block">
              TARGET TASK CONFLICT: #{conflict.taskCardId || conflict.id}
            </span>
            <p className="font-newsreader text-sm text-[var(--ink)]">
              Request an advisory explanation of the divergent mutations for &ldquo;{conflict.title}&rdquo;.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExplain}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-[var(--copper)] hover:bg-[var(--copper-deep)] text-[var(--paper-raised)] font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explain this conflict</span>
          </button>
        </div>
      )}

      {/* STATE C: ANALYZING (Subtle trace/progress, no giant spinner or fake thinking text) */}
      {aiState === 'ANALYZING' && (
        <div className="p-4 rounded-lg bg-[var(--paper)] border border-[var(--border)] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[var(--ink-soft)]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--copper)] animate-pulse" />
              Analyzing conflict…
            </span>
            <span className="text-[10px] text-[var(--ink-faint)]">EVALUATING CONTEXT VECTOR</span>
          </div>

          {/* Subtle Hairline Progress Indicator */}
          <div className="w-full h-1 bg-[var(--paper-raised)] rounded-full overflow-hidden border border-[var(--border)]">
            <div className="h-full bg-[var(--copper)] rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* STATE D: RESULT (Structured: What changed, Possible impact, Suggestion) */}
      {aiState === 'RESULT' && explanationData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            {/* 1. What Changed */}
            <div className="p-3.5 rounded-lg bg-[var(--paper)] border border-[var(--border)] space-y-1.5 flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--copper)] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--copper)]" />
                What Changed
              </span>
              <p className="font-newsreader text-sm text-[var(--ink)] leading-snug flex-1">
                {explanationData.whatChanged}
              </p>
            </div>

            {/* 2. Possible Impact */}
            <div className="p-3.5 rounded-lg bg-[var(--paper)] border border-[var(--border)] space-y-1.5 flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--ochre)] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ochre)]" />
                Possible Impact
              </span>
              <p className="font-newsreader text-sm text-[var(--ink-soft)] leading-snug flex-1">
                {explanationData.possibleImpact || 'No unlinked downstream dependencies identified in the active context.'}
              </p>
            </div>

            {/* 3. Suggestion */}
            <div className="p-3.5 rounded-lg bg-[var(--paper)] border-2 border-[var(--verdigris)]/40 space-y-1.5 flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[var(--verdigris)] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[var(--verdigris)]" />
                AI Suggestion (Advisory)
              </span>
              <p className="font-newsreader text-sm text-[var(--ink)] font-medium leading-snug flex-1">
                {explanationData.suggestion}
              </p>
            </div>
          </div>

          {/* Non-Authoritative Guidance Note */}
          <div className="px-3 py-2 rounded bg-[var(--paper-sunken)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-[var(--ink-faint)]">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3 text-[var(--copper)]" />
              <span>AI suggestions are advisory. Final convergence is verified solely by deterministic CRDT logic.</span>
            </span>
            <button
              type="button"
              onClick={handleExplain}
              className="text-[var(--copper)] hover:underline cursor-pointer flex items-center gap-1 shrink-0 self-end sm:self-auto"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Re-analyze</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE E: ERROR (Temporary failure fallback; manual resolution remains fully available) */}
      {aiState === 'ERROR' && (
        <div className="p-4 rounded-lg bg-[var(--rust)]/10 border border-[var(--rust)]/30 space-y-2">
          <div className="flex items-center gap-2 text-[var(--rust)] font-mono text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>AI assistance is temporarily unavailable. You can still resolve this conflict manually.</span>
          </div>
          <p className="font-newsreader text-xs sm:text-sm text-[var(--ink-soft)]">
            {errorMessage || 'The verification service did not return an explanation. Manual resolver options remain authoritative below.'}
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleExplain}
              className="px-3 py-1 rounded bg-[var(--paper)] border border-[var(--border)] hover:border-[var(--copper)] text-[var(--ink)] font-mono text-[10px] cursor-pointer transition"
            >
              Retry Explanation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
