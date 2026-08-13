import { createEntityHandlers } from "@/lib/entity-route";

export const dynamic = "force-dynamic";

export const { GET, PUT } = createEntityHandlers("events", {
  dateFields: ["date"],
  orderBy: "date",
});
