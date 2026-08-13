import { createEntityHandlers } from "@/lib/entity-route";

export const dynamic = "force-dynamic";

export const { GET, PUT } = createEntityHandlers("projects", {
  numericFields: ["investment"],
  dateFields: ["deadline"],
});
