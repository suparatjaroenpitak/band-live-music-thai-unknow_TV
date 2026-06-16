import { Activity, Gauge, Repeat2, Sparkles, Waves } from "lucide-react";
import { memo } from "react";
import { useStudioStore } from "../../store/useStudioStore";

export const EffectsPanel = memo(function EffectsPanel() {
  const mixer = useStudioStore((state) => state.mixer);
  const setMixerValue = useStudioStore((state) => state.setMixerValue);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.05] p-4 shadow-pad">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-amber-200" />
        <h2 className="text-lg font-semibold text-white">Effects</h2>
      </div>

      <div className="space-y-4">
        <EffectGroup icon={<Waves size={17} />} title="Reverb">
          <Slider label="Room Size" value={mixer.reverbRoomSize} min={0} max={1} step={0.01} display={`${Math.round(mixer.reverbRoomSize * 100)}%`} onChange={(value) => setMixerValue("reverbRoomSize", value)} />
          <Slider label="Wet" value={mixer.reverbWet} min={0} max={1} step={0.01} display={`${Math.round(mixer.reverbWet * 100)}%`} onChange={(value) => setMixerValue("reverbWet", value)} />
          <Slider label="Dry" value={mixer.reverbDry} min={0} max={1} step={0.01} display={`${Math.round(mixer.reverbDry * 100)}%`} onChange={(value) => setMixerValue("reverbDry", value)} />
        </EffectGroup>

        <EffectGroup icon={<Repeat2 size={17} />} title="Delay">
          <Slider label="Time" value={mixer.delayTime} min={0.02} max={1.2} step={0.01} display={`${Math.round(mixer.delayTime * 1000)} ms`} onChange={(value) => setMixerValue("delayTime", value)} />
          <Slider label="Feedback" value={mixer.delayFeedback} min={0} max={0.92} step={0.01} display={`${Math.round(mixer.delayFeedback * 100)}%`} onChange={(value) => setMixerValue("delayFeedback", value)} />
          <Slider label="Mix" value={mixer.delayMix} min={0} max={1} step={0.01} display={`${Math.round(mixer.delayMix * 100)}%`} onChange={(value) => setMixerValue("delayMix", value)} />
        </EffectGroup>

        <EffectGroup icon={<Sparkles size={17} />} title="Chorus">
          <Slider label="Depth" value={mixer.chorusDepth} min={0} max={1} step={0.01} display={`${Math.round(mixer.chorusDepth * 100)}%`} onChange={(value) => setMixerValue("chorusDepth", value)} />
          <Slider label="Rate" value={mixer.chorusRate} min={0.1} max={8} step={0.1} display={`${mixer.chorusRate.toFixed(1)} Hz`} onChange={(value) => setMixerValue("chorusRate", value)} />
          <Slider label="Mix" value={mixer.chorusMix} min={0} max={1} step={0.01} display={`${Math.round(mixer.chorusMix * 100)}%`} onChange={(value) => setMixerValue("chorusMix", value)} />
        </EffectGroup>

        <EffectGroup icon={<Activity size={17} />} title="EQ">
          <Slider label="Low" value={mixer.eqLow} min={-12} max={12} step={0.1} display={`${mixer.eqLow.toFixed(1)} dB`} onChange={(value) => setMixerValue("eqLow", value)} />
          <Slider label="Mid" value={mixer.eqMid} min={-12} max={12} step={0.1} display={`${mixer.eqMid.toFixed(1)} dB`} onChange={(value) => setMixerValue("eqMid", value)} />
          <Slider label="High" value={mixer.eqHigh} min={-12} max={12} step={0.1} display={`${mixer.eqHigh.toFixed(1)} dB`} onChange={(value) => setMixerValue("eqHigh", value)} />
        </EffectGroup>

        <EffectGroup icon={<Gauge size={17} />} title="Compressor">
          <Slider label="Threshold" value={mixer.compressorThreshold} min={-48} max={0} step={1} display={`${Math.round(mixer.compressorThreshold)} dB`} onChange={(value) => setMixerValue("compressorThreshold", value)} />
          <Slider label="Ratio" value={mixer.compressorRatio} min={1} max={20} step={0.1} display={`${mixer.compressorRatio.toFixed(1)}:1`} onChange={(value) => setMixerValue("compressorRatio", value)} />
          <Slider label="Attack" value={mixer.compressorAttack} min={0.001} max={0.12} step={0.001} display={`${Math.round(mixer.compressorAttack * 1000)} ms`} onChange={(value) => setMixerValue("compressorAttack", value)} />
          <Slider label="Release" value={mixer.compressorRelease} min={0.02} max={1.4} step={0.01} display={`${Math.round(mixer.compressorRelease * 1000)} ms`} onChange={(value) => setMixerValue("compressorRelease", value)} />
        </EffectGroup>
      </div>
    </section>
  );
});

function EffectGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-cyan-200">{icon}</span>
        {title}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-300">
        <span>{label}</span>
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
