/**
 * Текст «запроса пользователя» для истории как переписки (см. сканер).
 */

import { sanitizeLiveDataSnapshotForHistory } from "./snapshot-display";

export type ReportLikeForUserMessage = {
  report_kind: string;
  dtc_codes: string[];
  live_data_snapshot: Record<string, unknown>;
  vehicle?: {
    id: number;
    make: string;
    model: string;
    year: number | null;
  } | null;
};

export function formatUserRequestFull(
  detail: ReportLikeForUserMessage,
  isDev = false,
): string {
  const lines: string[] = [];
  const v = detail.vehicle;
  if (v) {
    lines.push(
      `Авто: ${v.make} ${v.model}${v.year != null ? ` (${v.year})` : ""}`,
    );
  }

  const snapRaw = detail.live_data_snapshot || {};
  const snapForDisplay = sanitizeLiveDataSnapshotForHistory(snapRaw, isDev);
  const devOnlyNote = isDev && snapRaw._dev_mode === true;
  const techCount = Object.keys(snapForDisplay).filter((k) => k !== "_dev_mode").length;

  if (detail.report_kind === "metrics") {
    lines.push("Запрос: интерпретация показателей (live data)");
    if (techCount > 0) {
      lines.push(`Контекст: показатели (${techCount} полей).`);
    }
    if (devOnlyNote) lines.push("(режим разработки — без OBD)");
    return lines.join("\n");
  }

  if (detail.dtc_codes.length > 0) {
    lines.push(`Запрос: анализ кодов ошибок: ${detail.dtc_codes.join(", ")}`);
  } else {
    lines.push("Запрос: анализ показателей без активных DTC (контекст — live data)");
  }

  if (techCount > 0) {
    lines.push(`К запросу приложен снимок live data (${techCount} полей).`);
  }
  if (devOnlyNote) {
    lines.push("(режим разработки — без OBD)");
  }

  return lines.join("\n");
}
