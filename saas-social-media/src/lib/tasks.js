import { STAGES, getAssignees, getStages } from "./posts";
import { stageDue } from "./team";

// Tarefas = etapas de posts não publicados que têm responsável e não estão aprovadas
export function buildTasks(posts, deadlines) {
  const out = [];
  for (const post of posts) {
    if (["published", "publishing"].includes(post.status)) continue;
    const stages = getStages(post);
    const assignees = getAssignees(post);
    STAGES.forEach(({ key, label }, i) => {
      const status = stages[key];
      if (status === "approved") return;
      const blockedBy = STAGES.slice(0, i).find((s) => stages[s.key] !== "approved");
      out.push({
        id: `${post.id}:${key}`,
        post,
        stage: key,
        stageLabel: label,
        status,
        assignee: assignees[key],
        due: stageDue(post, key, deadlines),
        blockedBy: status === "draft" && blockedBy ? blockedBy.label : null,
      });
    });
  }
  return out;
}

export const TASK_GROUPS = [
  { key: "changes_requested", label: "Ajuste pedido pelo cliente", empty: "Nenhum ajuste pendente." },
  { key: "draft", label: "A fazer", empty: "Nada para fazer agora." },
  { key: "in_review", label: "Aguardando o cliente", empty: "Nada aguardando aprovação." },
];

export function sortByDue(a, b) {
  const da = a.due ? a.due.getTime() : Infinity;
  const db = b.due ? b.due.getTime() : Infinity;
  return da - db;
}
