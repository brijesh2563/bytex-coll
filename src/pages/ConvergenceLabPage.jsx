import { useState } from 'react';
import { useSyncStore } from '../store/useSyncStore';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Radio,
  Sliders,
  WifiOff,
  Wifi,
  FileEdit,
  GitFork,
  ShieldCheck,
  RotateCcw,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function ConvergenceLabPage() {
  const {
    networkDriftMs,
    setNetworkDriftMs,
    chaosFlags,
    toggleChaosFlag,
    replicaA,
    replicaB,
    toggleReplicaOnline,
    setActivePage,
  } = useSyncStore();

  const [activeStep, setActiveStep] = useState(1);
  const [simLog, setSimLog] = useState([
    { id: '1', time: '14:20:01', text: 'Sandbox replicas initialized with identical Merkle roots.' },
  ]);

  const addLog = (text) => {
    setSimLog((prev) => [
      { id: Date.now().toString(), time: new Date().toLocaleTimeString(), text },
      ...prev.slice(0, 8),
    ]);
  };

  const handleStepClick = (stepNum) => {
    setActiveStep(stepNum);
    if (stepNum === 1) {
      if (replicaB.effectiveOnline) toggleReplicaOnline('replicaB');
      addLog('SIMULATION: Severed gossip socket to Replica B (Marcus Chen). Partition active.');
    } else if (stepNum === 2) {
      addLog('SIMULATION: Forked state delta created: Node A set dueDate="Nov 04", Node B set dueDate="Nov 19".');
    } else if (stepNum === 3) {
      if (!replicaB.effectiveOnline) toggleReplicaOnline('replicaB');
      addLog('SIMULATION: Reconnected network. Outbound vector queues streaming across mesh.');
    } else if (stepNum === 4) {
      addLog('SIMULATION: Conflict Detector flagged 2 diverged fields: dueDate and priority.');
    } else if (stepNum === 5) {
      addLog('SIMULATION: Join semilattice computed least upper bound (LUB). All nodes converged.');
    }
  };

  const resetSimulation = () => {
    setActiveStep(1);
    if (!replicaB.effectiveOnline) toggleReplicaOnline('replicaB');
    addLog('SIMULATION: Reset scenario. Replicas restored to verified sync.');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        breadcrumbs={['Workspace', 'Network Simulation']}
        title="Network Simulation"
        badge={
          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF5EC] text-[#C4872D] font-mono text-xs font-semibold">
            Advanced Sandbox
          </span>
        }
        description="Actions executed here simulate Byzantine packet drops, split-brain network partitions, and asynchronous state divergence without altering production state vectors."
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] text-xs font-mono">
              <span className="text-[#697775]">Clocks:</span>
              <span className="font-semibold text-[#15201F]">A:{replicaA.version} · B:{replicaB.version}</span>
            </div>
            <button
              type="button"
              onClick={resetSimulation}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F0F4F2] hover:bg-[#DCE5E1] text-[#15201F] font-sans text-xs font-semibold transition cursor-pointer border border-[#DCE5E1]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#176D70]" />
              <span>Reset Scenario</span>
            </button>
          </div>
        }
      />

      {/* 2. INTERACTIVE SANDBOX WORKSPACE (2 COLS) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lifecycle Stepper & Modulators (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Stepper Card */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-xs p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#176D70]" />
                <h2 className="font-display text-lg text-[#15201F] font-bold">
                  Lifecycle Test Steps
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#F0F4F2] text-[#176D70] font-semibold">
                Step {activeStep} of 5 Active
              </span>
            </div>

            <p className="font-sans text-xs text-[#697775]">
              Trigger synchronization events sequentially to evaluate Lamport timestamps and automated three-way CRDT resolution under partition strain.
            </p>

            {/* Step Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => handleStepClick(1)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  activeStep === 1
                    ? 'bg-[#E4F1EF] border-[#176D70] shadow-xs'
                    : 'bg-[#F0F4F2]/50 border-[#DCE5E1] hover:bg-[#F0F4F2]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                    activeStep === 1 ? 'bg-[#176D70] text-white' : 'bg-[#DCE5E1] text-[#697775]'
                  }`}>
                    1
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="font-sans text-xs text-[#15201F] font-semibold truncate">
                      Step 1: Partition Replica B
                    </span>
                    <span className="font-sans text-[11px] text-[#697775] truncate">
                      Sever inbound/outbound packets to Marcus
                    </span>
                  </div>
                </div>
                <WifiOff className="w-4 h-4 text-[#176D70] shrink-0" />
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => handleStepClick(2)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  activeStep === 2
                    ? 'bg-[#E4F1EF] border-[#176D70] shadow-xs'
                    : 'bg-[#F0F4F2]/50 border-[#DCE5E1] hover:bg-[#F0F4F2]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                    activeStep === 2 ? 'bg-[#176D70] text-white' : 'bg-[#DCE5E1] text-[#697775]'
                  }`}>
                    2
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="font-sans text-xs text-[#15201F] font-semibold truncate">
                      Step 2: Make Concurrent Edits
                    </span>
                    <span className="font-sans text-[11px] text-[#697775] truncate">
                      Fork state delta: Elena vs. Marcus in disconnected mode
                    </span>
                  </div>
                </div>
                <FileEdit className="w-4 h-4 text-[#176D70] shrink-0" />
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => handleStepClick(3)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  activeStep === 3
                    ? 'bg-[#E4F1EF] border-[#176D70] shadow-xs'
                    : 'bg-[#F0F4F2]/50 border-[#DCE5E1] hover:bg-[#F0F4F2]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                    activeStep === 3 ? 'bg-[#176D70] text-white' : 'bg-[#DCE5E1] text-[#697775]'
                  }`}>
                    3
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="font-sans text-xs text-[#15201F] font-semibold truncate">
                      Step 3: Reconnect Network
                    </span>
                    <span className="font-sans text-[11px] text-[#697775] truncate">
                      Re-establish gossip transport &amp; stream vector queues
                    </span>
                  </div>
                </div>
                <Wifi className="w-4 h-4 text-[#176D70] shrink-0" />
              </button>

              {/* Step 4 */}
              <button
                type="button"
                onClick={() => handleStepClick(4)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  activeStep === 4
                    ? 'bg-[#E4F1EF] border-[#176D70] shadow-xs'
                    : 'bg-[#F0F4F2]/50 border-[#DCE5E1] hover:bg-[#F0F4F2]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                    activeStep === 4 ? 'bg-[#176D70] text-white' : 'bg-[#DCE5E1] text-[#697775]'
                  }`}>
                    4
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="font-sans text-xs text-[#15201F] font-semibold truncate">
                      Step 4: Trigger Conflict Detector
                    </span>
                    <span className="font-sans text-[11px] text-[#697775] truncate">
                      Compute causal divergence &amp; 3-way ancestor diff
                    </span>
                  </div>
                </div>
                <GitFork className="w-4 h-4 text-[#176D70] shrink-0" />
              </button>

              {/* Step 5 */}
              <button
                type="button"
                onClick={() => handleStepClick(5)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                  activeStep === 5
                    ? 'bg-[#E4F1EF] border-[#176D70] shadow-xs'
                    : 'bg-[#F0F4F2]/50 border-[#DCE5E1] hover:bg-[#F0F4F2]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                    activeStep === 5 ? 'bg-[#176D70] text-white' : 'bg-[#DCE5E1] text-[#697775]'
                  }`}>
                    5
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="font-sans text-xs text-[#15201F] font-semibold truncate">
                      Step 5: Execute Convergence Proof
                    </span>
                    <span className="font-sans text-[11px] text-[#697775] truncate">
                      Merge State Tree through CRDT lattice math
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-[#176D70] shrink-0" />
              </button>
            </div>
          </div>

          {/* Fault Modulators Card */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-xs p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#176D70]" />
                <h3 className="font-display text-lg text-[#15201F] font-bold">
                  Fault Injection Modulators
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F0F4F2] text-[#697775]">
                SIMULATION ONLY
              </span>
            </div>

            {/* Latency Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-[#697775]">Synthetic Latency Drift</span>
                <span className="font-bold text-[#176D70]">{networkDriftMs} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="20"
                value={networkDriftMs}
                onChange={(e) => setNetworkDriftMs(Number(e.target.value))}
                className="w-full accent-[#176D70] cursor-pointer"
              />
            </div>

            {/* Toggle Flags */}
            <div className="flex flex-col gap-2 pt-2">
              <label
                onClick={() => toggleChaosFlag('dropPackets')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-sans text-xs font-semibold text-[#15201F]">Drop Packets (25% loss)</span>
                  <span className="font-sans text-[11px] text-[#B94A48]">Stochastic link sever simulation</span>
                </div>
                <input
                  type="checkbox"
                  checked={chaosFlags.dropPackets}
                  readOnly
                  className="w-4 h-4 accent-[#176D70]"
                />
              </label>

              <label
                onClick={() => toggleChaosFlag('duplicateOps')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-sans text-xs font-semibold text-[#15201F]">Duplicate Op Deliveries</span>
                  <span className="font-sans text-[11px] text-[#697775]">Replay attack / ghost duplicate echo</span>
                </div>
                <input
                  type="checkbox"
                  checked={chaosFlags.duplicateOps}
                  readOnly
                  className="w-4 h-4 accent-[#176D70]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mesh Topology & Simulation Event Stream (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Live Topology Matrix Card */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-xs p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#176D70]" />
                <h3 className="font-display text-lg text-[#15201F] font-bold">
                  Cluster Topology Status
                </h3>
              </div>
              <span className="font-mono text-xs text-[#2F7D68] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2 Peer Replicas Monitored
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Replica A Card */}
              <div className="bg-[#F0F4F2] rounded-xl p-4 border border-[#DCE5E1] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#15201F]">Node A (Current)</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E4F1EF] text-[#2F7D68] font-mono text-[10px] font-semibold">
                    {replicaA.effectiveOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#697775]">
                  <div>Vector Clock: L#{replicaA.version}</div>
                  <div>Pending Ops: {replicaA.pendingOps?.length || 0}</div>
                  <div>Partition: active_ops_a</div>
                </div>
              </div>

              {/* Replica B Card */}
              <div className="bg-[#F0F4F2] rounded-xl p-4 border border-[#DCE5E1] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#15201F]">Node B (Marcus)</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                    replicaB.effectiveOnline ? 'bg-[#E4F1EF] text-[#2F7D68]' : 'bg-[#FAF5EC] text-[#C4872D]'
                  }`}>
                    {replicaB.effectiveOnline ? 'Connected' : 'Partitioned'}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#697775]">
                  <div>Vector Clock: L#{replicaB.version}</div>
                  <div>Pending Ops: {replicaB.pendingOps?.length || 0}</div>
                  <div>Partition: active_ops_b</div>
                </div>
              </div>
            </div>

            {/* Jump to Conflict Resolver if at Step 4 */}
            {activeStep === 4 && (
              <div className="p-4 bg-[#FAF5EC] rounded-xl border border-[#C4872D]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-sans text-[#C4872D] font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Divergence staged in sandbox. Open Resolver to inspect 3-way diff.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage('conflicts')}
                  className="px-3 py-1.5 rounded-lg bg-[#176D70] text-white text-xs font-semibold hover:bg-[#13585A] transition shadow-xs cursor-pointer"
                >
                  Open Resolver
                </button>
              </div>
            )}
          </div>

          {/* Simulation Event Stream Card */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-xs p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5E1]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176D70]" />
                <h3 className="font-display text-lg text-[#15201F] font-bold">
                  Simulation Event Stream
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#697775]">
                Realtime Synthetic Ledger
              </span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              {simLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#F0F4F2] border border-[#DCE5E1] flex items-start gap-3"
                >
                  <span className="text-[#697775] shrink-0">{log.time}</span>
                  <span className="text-[#15201F]">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
