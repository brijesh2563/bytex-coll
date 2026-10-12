import { ConvergenceDial } from '../components/dial/ConvergenceDial';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useSyncStore } from '../store/useSyncStore';

export function MotionLabPage() {
  const { dialState, setDialState, setActivePage } = useSyncStore();

  return (
    <section className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      <div className="border-b border-[var(--line)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-[var(--ink)]">Motion Lab</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--ink-faint)] mt-1">
            /dev/motion-lab · Isolated Motion Token &amp; Dial State Playground
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setActivePage('observatory')}>
          ← Return to Observatory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card figure="EXP. 01" caption="ConvergenceDial Reactive States">
          <div className="flex flex-col items-center p-4">
            <ConvergenceDial size={280} />
          </div>
        </Card>

        <Card figure="EXP. 02" caption="State Controls &amp; Replay">
          <div className="flex flex-col gap-3">
            <p className="font-sans text-xs text-[var(--ink-soft)] mb-2">
              Click each state button below to trigger and observe the exact state transitions:
            </p>
            <Button
              variant={dialState === 'SYNCED' ? 'primary' : 'secondary'}
              onClick={() => setDialState('SYNCED')}
            >
              1. SYNCED (Aligned hub breathing 3s loop)
            </Button>
            <Button
              variant={dialState === 'DIVERGING' ? 'primary' : 'secondary'}
              onClick={() => setDialState('DIVERGING')}
            >
              2. DIVERGING (Arc B drifts with soft spring)
            </Button>
            <Button
              variant={dialState === 'CONFLICT' ? 'danger' : 'secondary'}
              onClick={() => setDialState('CONFLICT')}
            >
              3. CONFLICT (Vibrate 90ms x6 + ochre arc segment)
            </Button>
            <Button
              variant={dialState === 'CONVERGING' ? 'primary' : 'secondary'}
              onClick={() => setDialState('CONVERGING')}
            >
              4. CONVERGING (Arcs sweep together 1.4s out-quint)
            </Button>
            <Button
              variant={dialState === 'LOCKED' ? 'primary' : 'secondary'}
              onClick={() => setDialState('LOCKED')}
            >
              5. LOCKED (Needle snap + hash scramble settle)
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
