import { AuthConvergenceInstrument } from './AuthConvergenceInstrument';

/**
 * AuthVisualSide
 * 
 * Clean, uncluttered 40-45% left brand column for NexusSync Auth.
 * Contains strictly:
 * 1. NexusSync identity
 * 2. Custom 3D Convergence Instrument
 * 3. One short product message:
 *    "Keep your work safe and consistent, even when devices go offline."
 * 
 * Free of artificial telemetry, coordinates, badges, or decoration crosses.
 */
export function AuthVisualSide() {
  return (
    <div className="w-full flex flex-col justify-between items-center text-center p-6 sm:p-8 lg:p-10 rounded-2xl bg-[#FFFFFF] border border-[#DCE5E1] shadow-xs relative overflow-hidden h-full min-h-[380px] sm:min-h-[460px]">
      {/* 1. NexusSync Identity Header */}
      <div className="space-y-2 pt-2">
        <h2 className="font-display text-3xl sm:text-4xl text-[#15201F] tracking-tight">
          Nexus<span className="italic text-[#176D70]">Sync</span>
        </h2>
      </div>

      {/* 2. Custom 3D Convergence Instrument */}
      <div className="w-full my-auto py-4 flex items-center justify-center">
        <AuthConvergenceInstrument />
      </div>

      {/* 3. One Short Product Message */}
      <div className="pb-2 max-w-xs">
        <p className="font-newsreader text-sm sm:text-base text-[#697775] leading-relaxed">
          Keep your work safe and consistent, even when devices go offline.
        </p>
      </div>
    </div>
  );
}
