"use client";

import { useState } from "react";
import useStrategy from "./useStrategy";
import EditorialLine from "./EditorialLine";
import ScheduleTab from "./ScheduleTab";
import IdeasBoard from "./IdeasBoard";
import SaveBar from "./SaveBar";
import Loading from "../Loading";

// Abas de planejamento do cliente. Fica montado mesmo na aba "Visão geral"
// para não perder edições ao alternar entre as abas.
export default function PlanningArea({ client, tab }) {
  const strategyState = useStrategy(client.id);
  const [scheduleView, setScheduleView] = useState("weekly");
  if (!["editorial", "schedule", "ideas"].includes(tab)) {
    return <SaveBar dirty={strategyState.dirty} saving={strategyState.saving} onSave={strategyState.save} onDiscard={strategyState.discard} />;
  }
  if (!strategyState.loaded) return <Loading />;

  const showStrategyBar = tab === "editorial" || (tab === "schedule" && scheduleView === "weekly") || tab === "ideas";
  return (
    <>
      {tab === "editorial" && <EditorialLine strategy={strategyState.strategy} update={strategyState.update} />}
      {tab === "schedule" && <ScheduleTab client={client} strategyState={strategyState} view={scheduleView} setView={setScheduleView} />}
      {tab === "ideas" && <IdeasBoard client={client} pillars={strategyState.strategy.pillars} />}
      {showStrategyBar && <SaveBar dirty={strategyState.dirty} saving={strategyState.saving} onSave={strategyState.save} onDiscard={strategyState.discard} />}
    </>
  );
}
