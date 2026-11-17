"use client";

import { useState } from "react";
import useStrategy from "./useStrategy";
import Diagnosis from "./Diagnosis";
import Personas from "./Personas";
import Competitors from "./Competitors";
import Positioning from "./Positioning";
import Products from "./Products";
import ScheduleTab from "./ScheduleTab";
import IdeasBoard from "./IdeasBoard";
import SaveBar from "./SaveBar";
import Loading from "../Loading";

const STRATEGY_SECTIONS = ["diagnosis", "persona", "competitors", "positioning", "products", "schedule", "ideas"];

// Seções de planejamento do cliente. Fica montado em todas as seções para não
// perder edições ao alternar; a barra de salvar aparece sempre que houver mudança.
export default function PlanningArea({ client, section }) {
  const strategyState = useStrategy(client.id);
  const [scheduleView, setScheduleView] = useState("weekly");
  const { strategy, update } = strategyState;
  const bar = <SaveBar dirty={strategyState.dirty} saving={strategyState.saving} onSave={strategyState.save} onDiscard={strategyState.discard} />;

  if (!STRATEGY_SECTIONS.includes(section)) return bar;
  if (!strategyState.loaded) return <Loading />;
  const hideBar = section === "schedule" && scheduleView === "monthly" && !strategyState.dirty;

  return (
    <>
      {section === "diagnosis" && <Diagnosis strategy={strategy} update={update} />}
      {section === "persona" && <Personas strategy={strategy} update={update} />}
      {section === "competitors" && <Competitors strategy={strategy} update={update} />}
      {section === "positioning" && <Positioning strategy={strategy} update={update} />}
      {section === "products" && <Products strategy={strategy} update={update} />}
      {section === "schedule" && <ScheduleTab client={client} strategyState={strategyState} view={scheduleView} setView={setScheduleView} />}
      {section === "ideas" && <IdeasBoard client={client} pillars={strategy.pillars} />}
      {!hideBar && bar}
    </>
  );
}
