import { Headphones, SlidersHorizontal, Volume2, VolumeX } from "lucide-react";
import { memo, useCallback } from "react";
import { useStudioStore } from "../../store/useStudioStore";

export const MixerPanel = memo(function MixerPanel() {
  const mixer = useStudioStore((state) => state.mixer);
  const setMixerValue = useStudioStore((state) => state.setMixerValue);
  const setMuted = useCallback(() => setMixerValue("muted", !mixer.muted), [mixer.muted, setMixerValue]);
  const setSolo = useCallback(() => setMixerValue("solo", !mixer.solo), [mixer.solo, setMixerValue]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.05] p-4 shadow-pad">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-cyan-200" />
        <h2 className="text-lg font-semibold text-white">Mixer</h2>
      </div>

      <div className="grid gap-3">
        <Slider
          icon={<Volume2 size={16} />}
          label="Master Volume"
          value={mixer.masterVolume}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(mixer.masterVolume * 100)}%`}
          onChange={(value) => setMixerValue("masterVolume", value)}
        />
        <Slider
          icon={<Volume2 size={16} />}
          label="Instrument Volume"
          value={mixer.instrumentVolume}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(mixer.instrumentVolume * 100)}%`}
          onChange={(value) => setMixerValue("instrumentVolume", value)}
        />
        <Slider
          icon={<Headphones size={16} />}
          label="Pan"
          value={mixer.pan}
          min={-1}
          max={1}
          step={0.01}
          display={panLabel(mixer.pan)}
          onChange={(value) => setMixerValue("pan", value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <ToggleButton active={mixer.muted} label="Mute" icon={<VolumeX size={16} />} onClick={setMuted} />
          <ToggleButton active={mixer.solo} label="Solo" icon={<Headphones size={16} />} onClick={setSolo} />
        </div>
      </div>
    </section>
  );
});

function Slider({
  label,
  icon,
  value,
  min,
  max,
  step,
  display,
  onChange
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-lg border border-white/10 bg-black/20 p-3">
      <span className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <span className="text-slate-400">{display}</span>
      </span>
      <input
        className="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ToggleButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${
        active ? "border-cyan-200/60 bg-cyan-300/20 text-cyan-100" : "border-white/10 bg-black/20 text-slate-200 hover:bg-white/10"
      }`}
      onClick={onClick}
      type="button"
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

function panLabel(value: number) {
  if (Math.abs(value) < 0.01) return "Center";
  return value < 0 ? `L ${Math.round(Math.abs(value) * 100)}` : `R ${Math.round(value * 100)}`;
}
