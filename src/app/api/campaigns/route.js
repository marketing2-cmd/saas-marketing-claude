import { createEntityHandlers } from "@/lib/entity-route";

export const dynamic = "force-dynamic";

export const { GET, PUT } = createEntityHandlers("campaigns", {
  numericFields: ["budget", "budgetSpent"],
  dateFields: ["startDate", "endDate"],
});
