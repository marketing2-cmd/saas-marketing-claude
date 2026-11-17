"use client";

import WeeklySchedule from "./WeeklySchedule";
import MonthlyPlan from "./MonthlyPlan";

export default function ScheduleTab({ client, strategyState, view, setView }) {
  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl border border-line bg-white p-1 text-sm">
        {[["weekly", "Semanal"], ["monthly", "Mensal"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} className={`rounded-lg px-4 py-1.5 font-semibold transition ${view === k ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>{l}</button>
        ))}
      </div>
      {view === "weekly" ? (
        <WeeklySchedule client={client} strategy={strategyState.strategy} update={strategyState.update} dirty={strategyState.dirty} />
      ) : (
        <MonthlyPlan client={client} />
      )}
    </div>
  );
}
