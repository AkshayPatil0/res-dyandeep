export interface DisclosureAction {
  type: "pdf" | "video";
  link: string | null;
}

export interface DisclosureItem {
  id: number;
  title: string;
  action: DisclosureAction[];
}

export const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1JeuHAMbsg7uGf_1Oh8NCjO99nhYtQWQa7dsrVy3qrWA/edit?usp=sharing";

export const DEFAULT_DISCLOSURES: DisclosureItem[] = [
  {
    id: 1,
    title: "TRUST REGISTRATION",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 2,
    title: "NOC",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 3,
    title: "RECOGNITION CERTIFICATE",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 4,
    title: "BUILDING SAFETY CERTIFICATE",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 5,
    title: "FIRE SAFETY CERTIFICATE",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 6,
    title: "WATER HEALTH & SANITARY CERTIFICATE",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 7,
    title: "FEE STRUCTURE OF THE SCHOOL",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 8,
    title: "ANNUAL ACADEMIC CALENDAR",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 9,
    title: "SMC (SCHOOL MANAGEMENT COMMITTEE)",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 10,
    title: "PTA (PARENT TEACHER ASSOCIATION)",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 11,
    title: "RTE COMPLIANCE",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 12,
    title: "TEACHING STAFF DETAILS",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 13,
    title: "CERTIFICATE OF LAND",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 14,
    title: "SELF CERTIFICATE",
    action: [{ type: "pdf", link: null }],
  },
  {
    id: 15,
    title: "LIBRARY INFRASTRUCTURE",
    action: [
      { type: "pdf", link: null },
      { type: "video", link: null },
    ],
  },
  {
    id: 16,
    title: "SCHOOL COMPOUND",
    action: [
      { type: "pdf", link: null },
      { type: "video", link: null },
    ],
  },
  {
    id: 17,
    title: "CWSN - ACCESSIBILITY & FACILITIES",
    action: [
      { type: "pdf", link: null },
      { type: "video", link: null },
    ],
  },
  {
    id: 18,
    title: "SCIENCE LAB",
    action: [
      { type: "pdf", link: null },
      { type: "video", link: null },
    ],
  },
  {
    id: 19,
    title: "SCHOOL ENTRY VIEW & CLASS ROOMS",
    action: [
      { type: "pdf", link: null },
      { type: "video", link: null },
    ],
  },
  {
    id: 20,
    title: "COMPUTER LAB",
    action: [
      { type: "pdf", link: null },
      { type: "video", link: null },
    ],
  },
];

/**
 * Extract Google Sheet ID from full Google Sheet URL or ID string
 */
export function extractSheetId(inputUrlOrId: string | null | undefined): string | null {
  if (!inputUrlOrId || !inputUrlOrId.trim()) return null;
  const trimmed = inputUrlOrId.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Format Google Drive URLs into viewable web links
 */
export function formatDriveLink(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const cleaned = url.trim();
  if (cleaned.toLowerCase() === "null" || cleaned.toLowerCase() === "test" || cleaned === "-") {
    return null;
  }
  return cleaned;
}

/**
 * Fetch disclosures live from public Google Sheet (GViz JSON API endpoint)
 */
export async function getDisclosuresFromSheet(sheetUrlOrId?: string): Promise<DisclosureItem[]> {
  const envVal = import.meta.env.PUBLIC_GOOGLE_SHEET_URL || import.meta.env.PUBLIC_GOOGLE_SHEET_ID || DEFAULT_SHEET_URL;
  const targetSheetId = extractSheetId(sheetUrlOrId || envVal);

  if (!targetSheetId) {
    return DEFAULT_DISCLOSURES;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${targetSheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("Invalid response format");

    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);

    const rows = parsed.table?.rows || [];
    if (!rows || rows.length === 0) return DEFAULT_DISCLOSURES;

    const items: DisclosureItem[] = rows.map((row: any, index: number) => {
      const c = row.c || [];
      const id = c[0]?.v ? Number(c[0].v) : index + 1;
      const title = c[1]?.v ? String(c[1].v) : `Document ${id}`;
      const pdfLink = formatDriveLink(c[2]?.v ? String(c[2].v) : null);
      const videoLink = formatDriveLink(c[3]?.v ? String(c[3].v) : null);

      const action: DisclosureAction[] = [{ type: "pdf", link: pdfLink }];
      if (c[3] !== undefined || videoLink !== null) {
        action.push({ type: "video", link: videoLink });
      }

      return { id, title, action };
    });

    return items.length > 0 ? items : DEFAULT_DISCLOSURES;
  } catch (err) {
    console.warn("Failed to fetch disclosures from Google Sheet, using defaults:", err);
    return DEFAULT_DISCLOSURES;
  }
}
