import { Gauge, SlidersHorizontal, Volume2 } from "lucide-react";
import { useStudioStore } from "../../store/useStudioStore";
import type { MixerState } from "../../types";

export function MixerPanel() {
  const mixer = useStudioStore((state) => state.mixer);
  const setMixerValue = useStudioStore((state) => state.setMixerValue);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.05] p-4 shadow-pad">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-cyan-200" />
        <h2 className="text-lg font-semibold text-white">Mixer</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Slider
          icon={<Volume2 size={16} />}
          label="Master"
          value={mixer.masterVolume}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(mixer.masterVolume * 100)}%`}
          onChange={(value) => setMixerValue("masterVolume", value)}
        />
        <Slider
          icon={<Volume2 size={16} />}
          label="Instrument"
          value={mixer.instrumentVolume}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(mixer.instrumentVolume * 100)}%`}
          onChange={(value) => setMixerValue("instrumentVolume", value)}
        />
        <Slider
          icon={<Gauge size={16} />}
          label="Compressor"
          value={mixer.compressor}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(mixer.compressor * 100)}%`}
          onChange={(value) => setMixerValue("compressor", value)}
        />
        <Slider
          icon={<Gauge size={16} />}
          label="Limiter"
          value={mixer.limiter}
          min={0}
          max={1}
          step={0.01}
          display={`${Math.round(mixer.limiter * 100)}%`}
          onChange={(value) => setMixerValue("limiter", value)}
        />
        <Slider
          label="EQ Low"
          value={mixer.eqLow}
          min={-12}
          max={12}
          step={0.1}
          display={`${mixer.eqLow.toFixed(1)} dB`}
          onChange={(value) => setMixerValue("eqLow", value)}
        />
        <Slider
          label="EQ Mid"
          value={mixer.eqMid}
          min={-12}
          max={12}
          step={0.1}
          display={`${mixer.eqMid.toFixed(1)} dB`}
          onChange={(value) => setMixerValue("eqMid", value)}
        />
        <Slider
          label="EQ High"
          value={mixer.eqHigh}
          min={-12}
          max={12}
          step={0.1}
          display={`${mixer.eqHigh.toFixed(1)} dB`}
          onChange={(value) => setMixerValue("eqHigh", value)}
        />
      </div>
    </section>
  );
}

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
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-lg border border-white/10 bg-black/20 p-3">
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
        onChange={(event) => onChange(Number(event.target.value) as MixerState[keyof MixerState])}
      />
    </label>
  );
}
