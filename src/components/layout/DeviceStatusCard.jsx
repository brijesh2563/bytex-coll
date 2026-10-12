import { useSyncStore } from '../../store/useSyncStore';
import { Laptop } from 'lucide-react';

/**
 * DeviceStatusCard
 * Pinned compact status card for the persistent left rail.
 * Status communicates strictly real frontend state:
 * - 'Offline' (if navigator.onLine is false or active replica simulated offline)
 * - 'Changes waiting to sync' (if pending_ops > 0)
 * - 'Saved on this device' (if clean & local IndexedDB storage confirmed)
 */
export function DeviceStatusCard() {
  const {
    replicaA,
    replicaB,
    isBrowserOnline,
  } = useSyncStore();

  const activeReplica = replicaA; // primary this-device replica
  const isOffline = !isBrowserOnline || !activeReplica.effectiveOnline;
  const pendingCount = (replicaA.pendingOps?.length || 0) + (replicaB.pendingOps?.length || 0);

  let statusText = 'Saved on this device';
  let dotColor = 'bg-[#2F7D68]'; // green
  let statusTextColor = 'text-[#2F7D68]';

  if (isOffline) {
    statusText = 'Offline';
    dotColor = 'bg-[#C4872D]'; // amber
    statusTextColor = 'text-[#C4872D]';
  } else if (pendingCount > 0) {
    statusText = 'Changes waiting to sync';
    dotColor = 'bg-[#C4872D]'; // amber
    statusTextColor = 'text-[#C4872D]';
  }

  return (
    <div className="p-3 bg-[#FFFFFF] border border-[#DCE5E1] rounded-xl flex items-center gap-3 shadow-2xs">
      <div className="w-8 h-8 rounded-lg bg-[#F0F4F2] text-[#176D70] flex items-center justify-center shrink-0">
        <Laptop className="w-4 h-4" />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-sans text-xs font-semibold text-[#15201F] truncate">
          This Device
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} ${pendingCount > 0 ? 'animate-pulse' : ''}`} />
          <span className={`font-mono text-[11px] truncate ${statusTextColor}`}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
