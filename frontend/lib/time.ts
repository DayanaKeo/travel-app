import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";

export function formatFR(date: string | Date, pattern = "dd/MM/yyyy HH:mm") {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, "Europe/Paris", pattern, { locale: fr });
}
