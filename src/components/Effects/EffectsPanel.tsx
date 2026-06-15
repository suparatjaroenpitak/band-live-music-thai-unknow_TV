import { Repeat2, Sparkles, Waves } from "lucide-react";
import { useStudioStore } from "../../store/useStudioStore";

export function EffectsPanel() {
  const mixer = useStudioStore((state) => state.mixer);
  const setMixerValue = useStudioStore((state) => state.setMixerValue);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.05] p-4 shadow-pad">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-amber-200" />
        <h2 className="text-lg font-semibold text-white">Effects</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <EffectDial label="Reverb" icon={<Waves size={18} />} value={mixer.reverb} onChange={(value) => setMixerValue("reverb", value)} />
        <EffectDial label="Delay" icon={<Repeat2 size={18} />} value={mixer.delay} onChange={(value) => setMixerValue("delay", value)} />
        <EffectDial label="Chorus" icon={<Sparkles size={18} />} value={mixer.chorus} onChange={(value) => setMixerValue("chorus", value)} />
      </div>
    </section>
  );
}

function EffectDial({
  label,
  icon,
  value,
  onChange
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}) {
  const degree = -120 + value * 240;

  return (
    <label className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
      <span className="relative grid size-16 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
        <span
          className="absolute left-1/2 top-1/2 h-7 w-[3px] origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-cyan-200"
          style={{ transform: `translate(-50%, -100%) rotate(${degree}deg)` }}
        />
        <span className="text-slate-200">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between text-sm font-semibold text-white">
          {label}
          <span className="text-xs text-slate-400">{Math.round(value * 100)}%</span>
        </span>
        <input className="mt-2 w-full" type="range" min={0} max={1} step={0.01} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      </span>
    </label>
  );
}
