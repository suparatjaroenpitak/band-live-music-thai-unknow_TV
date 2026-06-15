import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useRef } from "react";
import { useStudioStore } from "../../store/useStudioStore";
import { downloadJson } from "../../utils/download";
import { validateProjectData } from "../../utils/validation";

export function ProjectActions() {
  const projectName = useStudioStore((state) => state.projectName);
  const setProjectName = useStudioStore((state) => state.setProjectName);
  const exportProject = useStudioStore((state) => state.exportProject);
  const importProject = useStudioStore((state) => state.importProject);
  const lastSavedAt = useStudioStore((state) => state.lastSavedAt);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || file.size > 512_000) return;

    try {
      const project = validateProjectData(JSON.parse(await file.text()) as unknown);
      if (project) importProject(project);
    } catch {
      return;
    }
  };

  return (
    <section className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] p-3 shadow-pad">
      <input
        className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none focus:border-cyan-200/70"
        value={projectName}
        onChange={(event) => setProjectName(event.target.value)}
        aria-label="Project name"
      />
      <span className="hidden text-xs text-slate-400 md:inline">
        {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Autosave ready"}
      </span>
      <button
        className="grid size-10 place-items-center rounded-lg border border-white/10 bg-black/20 text-slate-100 transition hover:bg-white/10"
        onClick={() => downloadJson(exportProject(), "smart-music-project.json")}
        aria-label="Export project"
        title="Export project"
      >
        <Download size={18} />
      </button>
      <button
        className="grid size-10 place-items-center rounded-lg border border-white/10 bg-black/20 text-slate-100 transition hover:bg-white/10"
        onClick={() => inputRef.current?.click()}
        aria-label="Import project"
        title="Import project"
      >
        <Upload size={18} />
      </button>
      <input ref={inputRef} className="hidden" type="file" accept="application/json,.json" onChange={handleImport} />
    </section>
  );
}
