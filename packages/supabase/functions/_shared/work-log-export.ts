import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import type { Database } from "./database.types.ts";

type CoreSchemaTables = Database extends { core: { Tables: infer Tables } }
  ? Tables
  : never;

type CoreWorkLogRow = CoreSchemaTables extends Record<string, unknown>
  ? "work_logs" extends keyof CoreSchemaTables
    ? CoreSchemaTables["work_logs"] extends { Row: infer RowType } ? RowType
    : null
  : null
  : null;

type WorkLogRowFallback = {
  id: string;
  user_id: string;
  status?: string | null;
  project_id?: string | null;
  time_entries?: unknown;
  tasks_completed?: string[] | null;
  skills_used?: string[] | null;
  visibility?: string | null;
  show_on_profile?: boolean | null;
  show_date_range_on_profile?: boolean | null;
  entry_type?: string | null;
  log_date?: string | null;
  work_description?: string | null;
  total_hours?: number | string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
  disputed_at?: string | null;
  dispute_reason?: string | null;
  gps_captured_at?: string | null;
  device_type?: string | null;
  location_permission_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WorkLogRow =
  & (CoreWorkLogRow extends null ? Record<string, unknown> : CoreWorkLogRow)
  & WorkLogRowFallback;

export interface WorkLogExportCollaborator {
  userId: string;
  displayName: string;
  permissionLevel: "view" | "edit";
}

export interface WorkLogExportTimeEntry {
  start: string;
  end: string;
  durationHours: number;
  breakMinutes: number;
  description?: string | null;
}

export interface WorkLogExportSnapshot {
  workLog: WorkLogRow;
  ownerName: string;
  ownerEmail?: string | null;
  projectName?: string | null;
  projectIdentifier?: string | null;
  organizationName?: string | null;
  organizationIdentifier?: string | null;
  totalHours: number;
  tasks: string[];
  skills: string[];
  skillSummaries: Array<{
    id: string;
    label: string;
    taxonomy: "csi" | "onet";
    tradeId: string | null;
    tradeName: string | null;
    tradeSlug: string | null;
  }>;
  timeEntries: WorkLogExportTimeEntry[];
  collaborators: WorkLogExportCollaborator[];
  photoCount: number;
  commentCount: number;
}

const CSV_SEPARATOR = ",";

const escapeCsvCell = (value: string): string => {
  if (
    value.includes('"') || value.includes(CSV_SEPARATOR) || value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildWorkLogCsv = (snapshot: WorkLogExportSnapshot): string => {
  const rows: Array<[string, string]> = [
    ["Work Log ID", snapshot.workLog.id],
    ["Worker", snapshot.ownerName],
    ["Worker Email", snapshot.ownerEmail ?? ""],
    ["Date", snapshot.workLog.log_date ?? ""],
    ["Entry Type", snapshot.workLog.entry_type ?? ""],
    ["Status", snapshot.workLog.status ?? ""],
    ["Project", snapshot.projectName ?? "Unknown"],
    ["Project Identifier", snapshot.projectIdentifier ?? ""],
    ["Organization", snapshot.organizationName ?? "Unknown"],
    ["Organization Identifier", snapshot.organizationIdentifier ?? ""],
    ["Total Hours", snapshot.totalHours.toFixed(2)],
    [
      "Time Entries",
      snapshot.timeEntries.length
        ? snapshot.timeEntries
          .map((entry) => {
            const duration = entry.durationHours.toFixed(2);
            const breakMinutes = entry.breakMinutes > 0
              ? ` (break ${entry.breakMinutes}m)`
              : "";
            const description = entry.description
              ? ` - ${entry.description}`
              : "";
            return `${entry.start} - ${entry.end} (${duration}h${breakMinutes})${description}`;
          })
          .join(" | ")
        : "None",
    ],
    [
      "Tasks Completed",
      snapshot.tasks.length ? snapshot.tasks.join("; ") : "None",
    ],
    [
      "Skills Used",
      snapshot.skills.length ? snapshot.skills.join("; ") : "None",
    ],
    [
      "Collaborators",
      snapshot.collaborators.length
        ? snapshot.collaborators
          .map((collaborator) =>
            `${collaborator.displayName} (${collaborator.permissionLevel})`
          )
          .join("; ")
        : "None",
    ],
    ["Photos Attached", String(snapshot.photoCount)],
    ["Comments Recorded", String(snapshot.commentCount)],
    ["Work Description", snapshot.workLog.work_description ?? ""],
    ["Created At", snapshot.workLog.created_at ?? ""],
    ["Submitted At", snapshot.workLog.submitted_at ?? ""],
    ["Verified At", snapshot.workLog.verified_at ?? ""],
    ["Disputed At", snapshot.workLog.disputed_at ?? ""],
    ["Dispute Reason", snapshot.workLog.dispute_reason ?? ""],
    ["GPS Captured At", snapshot.workLog.gps_captured_at ?? ""],
    ["Device Type", snapshot.workLog.device_type ?? ""],
    [
      "Location Permission Status",
      snapshot.workLog.location_permission_status ?? "",
    ],
  ];

  const header = ["Field", "Value"].map(escapeCsvCell).join(CSV_SEPARATOR);
  const body = rows
    .map(([field, value]) =>
      [field, value].map(escapeCsvCell).join(CSV_SEPARATOR)
    )
    .join("\n");

  return `${header}\n${body}`;
};

const wrapText = (
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const testLine = `${currentLine} ${words[i]}`;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }

    lines.push(currentLine);
  }

  return lines;
};

const ensureSpace = (
  state: {
    y: number;
    margin: number;
    lineHeight: number;
    page: PDFPage;
    addPage: () => void;
  },
  linesNeeded: number,
) => {
  if (state.y - state.lineHeight * linesNeeded < state.margin) {
    state.addPage();
  }
};

const formatHours = (value: number) => `${value.toFixed(2)}h`;

export const buildWorkLogPdf = async (
  snapshot: WorkLogExportSnapshot,
): Promise<Uint8Array> => {
  const document = await PDFDocument.create();
  const firstPage = document.addPage();
  const fontRegular = await document.embedFont(StandardFonts.Helvetica);
  const fontBold = await document.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const lineHeight = 16;

  const state = {
    page: firstPage,
    y: firstPage.getHeight() - margin,
    margin,
    lineHeight,
    addPage: () => {
      const newPage = document.addPage();
      state.page = newPage;
      state.y = newPage.getHeight() - margin;
    },
  };

  const drawHeading = (text: string) => {
    ensureSpace(state, 1);
    state.page.drawText(text, {
      x: margin,
      y: state.y,
      size: 14,
      font: fontBold,
    });
    state.y -= lineHeight * 1.5;
  };

  const drawLines = (lines: string[]) => {
    for (const line of lines) {
      if (!line) {
        ensureSpace(state, 1);
        state.y -= lineHeight;
        continue;
      }
      ensureSpace(state, 1);
      state.page.drawText(line, {
        x: margin,
        y: state.y,
        size: 12,
        font: fontRegular,
      });
      state.y -= lineHeight;
    }
    state.y -= lineHeight * 0.5;
  };

  const availableWidth = state.page.getWidth() - margin * 2;

  const summaryPairs: Array<[string, string]> = [
    ["Work Log ID", snapshot.workLog.id],
    ["Worker", snapshot.ownerName],
    ["Worker Email", snapshot.ownerEmail ?? "—"],
    ["Date", snapshot.workLog.log_date ?? "—"],
    ["Entry Type", snapshot.workLog.entry_type ?? "—"],
    ["Status", snapshot.workLog.status ?? "—"],
    ["Project", snapshot.projectName ?? "Unknown"],
    ["Organization", snapshot.organizationName ?? "Unknown"],
    ["Total Hours", formatHours(snapshot.totalHours)],
    ["Photos Attached", String(snapshot.photoCount)],
    ["Comments Recorded", String(snapshot.commentCount)],
  ];

  drawHeading("Work Log Summary");
  const summaryLines = summaryPairs.map(([label, value]) =>
    `${label}: ${value}`
  );
  for (const line of summaryLines) {
    const wrapped = wrapText(line, fontRegular, 12, availableWidth);
    drawLines(wrapped);
  }

  drawHeading("Work Description");
  drawLines(
    wrapText(
      snapshot.workLog.work_description ?? "Not provided.",
      fontRegular,
      12,
      availableWidth,
    ),
  );

  drawHeading("Tasks Completed");
  drawLines(
    snapshot.tasks.length
      ? snapshot.tasks.flatMap((task, index) =>
        wrapText(`${index + 1}. ${task}`, fontRegular, 12, availableWidth)
      )
      : ["No tasks were recorded for this work log."],
  );

  drawHeading("Time Entries");
  drawLines(
    snapshot.timeEntries.length
      ? snapshot.timeEntries.flatMap((entry, index) =>
        wrapText(
          `${index + 1}. ${entry.start} - ${entry.end}  •  ${
            formatHours(entry.durationHours)
          }${entry.breakMinutes > 0 ? ` (break ${entry.breakMinutes}m)` : ""}${
            entry.description ? `  •  ${entry.description}` : ""
          }`,
          fontRegular,
          12,
          availableWidth,
        )
      )
      : ["No time entries were recorded."],
  );

  drawHeading("Collaborators");
  drawLines(
    snapshot.collaborators.length
      ? snapshot.collaborators.map(
        (collaborator, index) =>
          `${
            index + 1
          }. ${collaborator.displayName} (${collaborator.permissionLevel})`,
      )
      : ["No collaborators were added to this work log."],
  );

  drawHeading("Skills Used");
  drawLines(
    snapshot.skills.length
      ? snapshot.skills.map((skill, index) => `${index + 1}. ${skill}`)
      : ["No skills were associated with this work log."],
  );

  return document.save();
};
