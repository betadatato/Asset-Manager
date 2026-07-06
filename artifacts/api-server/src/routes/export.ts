import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, cvsTable, experiencesTable, educationsTable, languagesTable } from "@workspace/db";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType,
  ShadingType,
} from "docx";

const router: IRouter = Router();

// Helper: escape HTML to prevent XSS when interpolating user content into HTML
function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Helper: load full CV
async function loadFullCv(id: number) {
  const [cv] = await db.select().from(cvsTable).where(eq(cvsTable.id, id));
  if (!cv) return null;
  const [experiences, educations, languages] = await Promise.all([
    db.select().from(experiencesTable).where(eq(experiencesTable.cvId, id)).orderBy(asc(experiencesTable.sortOrder)),
    db.select().from(educationsTable).where(eq(educationsTable.cvId, id)).orderBy(asc(educationsTable.sortOrder)),
    db.select().from(languagesTable).where(eq(languagesTable.cvId, id)).orderBy(asc(languagesTable.sortOrder)),
  ]);
  return { ...cv, experiences, educations, languages };
}

// Helper: format date string MM/YYYY
function fmtDate(d: string | null | undefined): string {
  if (!d) return "Present";
  // Accept YYYY-MM or YYYY-MM-DD
  const parts = d.split("-");
  if (parts.length >= 2) return `${parts[1]}/${parts[0]}`;
  return d;
}

// Helper: hex to docx color (strip #)
function hexColor(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

// GET /cvs/:id/export/pdf — generates an HTML page the browser can print to PDF
router.get("/cvs/:id/export/pdf", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const cv = await loadFullCv(id);
  if (!cv) { res.status(404).json({ error: "CV not found" }); return; }

  const color = cv.mainColor || "#003399";
  const safeColor = color.startsWith("#") ? color : `#${color}`;
  // photoUrl is a server-generated path, not user input — safe to use directly
  const photoSrc = cv.photoUrl
    ? `<img src="${esc(cv.photoUrl)}" alt="Photo" class="photo" />`
    : `<div class="photo-placeholder"></div>`;

  const decorativeSvg = cv.useGraphics
    ? `<svg class="deco-line" viewBox="0 0 800 8" xmlns="http://www.w3.org/2000/svg">
         <rect width="800" height="4" fill="${safeColor}" opacity="0.3"/>
         <rect width="200" height="8" fill="${safeColor}"/>
       </svg>`
    : "";

  const expHtml = (cv.experiences as typeof cv.experiences).map((e: typeof cv.experiences[0]) => `
    <div class="entry">
      <div class="entry-dates">${esc(fmtDate(e.startDate))} – ${esc(fmtDate(e.endDate))}</div>
      <div class="entry-body">
        <div class="entry-title">${esc(e.jobTitle)}</div>
        <div class="entry-sub">${esc(e.employer)}${e.city ? `, ${esc(e.city)}` : ""}</div>
        ${e.description ? `<div class="entry-desc">${esc(e.description).replace(/\n/g, "<br/>")}</div>` : ""}
      </div>
    </div>`).join("");

  const eduHtml = (cv.educations as typeof cv.educations).map((e: typeof cv.educations[0]) => `
    <div class="entry">
      <div class="entry-dates">${esc(fmtDate(e.startDate))} – ${esc(fmtDate(e.endDate))}</div>
      <div class="entry-body">
        <div class="entry-title">${esc(e.degree)}</div>
        <div class="entry-sub">${esc(e.institution)}${e.city ? `, ${esc(e.city)}` : ""}${e.grade ? ` — ${esc(e.grade)}` : ""}</div>
      </div>
    </div>`).join("");

  const langHtml = cv.languages.length ? `
    <table class="lang-table">
      <thead>
        <tr>
          <th></th>
          <th colspan="2">Understanding</th>
          <th colspan="2">Speaking</th>
          <th>Writing</th>
        </tr>
        <tr>
          <th></th>
          <th>Listening</th><th>Reading</th>
          <th>Interaction</th><th>Production</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${(cv.languages as typeof cv.languages).map((l: typeof cv.languages[0]) => `
          <tr>
            <td><strong>${esc(l.languageName)}</strong></td>
            <td>${esc(l.listening) || "–"}</td>
            <td>${esc(l.reading) || "–"}</td>
            <td>${esc(l.spokenInteraction) || "–"}</td>
            <td>${esc(l.spokenProduction) || "–"}</td>
            <td>${esc(l.writing) || "–"}</td>
          </tr>`).join("")}
      </tbody>
    </table>` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Europass CV – ${cv.fullName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #1a1a1a; background: white; }
  .page { display: flex; width: 210mm; min-height: 297mm; }
  .sidebar {
    width: 70mm; min-height: 297mm; padding: 12mm 6mm 8mm;
    background: ${safeColor}18;
    border-right: 3px solid ${safeColor};
    display: flex; flex-direction: column; gap: 10px;
  }
  .main { flex: 1; padding: 10mm 10mm 8mm; display: flex; flex-direction: column; gap: 10px; }
  .photo {
    width: 35mm; height: 45mm; border-radius: 50%;
    object-fit: cover; object-position: top;
    border: 3px solid ${safeColor}; display: block; margin: 0 auto 8px;
  }
  .photo-placeholder {
    width: 35mm; height: 45mm; border-radius: 50%;
    background: ${safeColor}30; border: 3px solid ${safeColor};
    display: block; margin: 0 auto 8px;
  }
  .name-block { text-align: center; }
  .full-name { font-size: 12pt; font-weight: bold; color: ${safeColor}; }
  .sidebar-section-title {
    font-size: 7.5pt; font-weight: bold; text-transform: uppercase;
    color: ${safeColor}; letter-spacing: 0.5px;
    border-bottom: 1px solid ${safeColor}55; padding-bottom: 2px; margin-bottom: 4px;
  }
  .contact-item { font-size: 8pt; margin-bottom: 2px; word-break: break-word; }
  .contact-item strong { font-size: 7pt; text-transform: uppercase; color: #555; display: block; }
  .section-title {
    font-size: 10pt; font-weight: bold; text-transform: uppercase;
    color: ${safeColor}; letter-spacing: 0.5px;
    border-bottom: 2px solid ${safeColor}; padding-bottom: 3px; margin-bottom: 6px;
  }
  .deco-line { width: 100%; height: 8px; display: block; margin-bottom: 8px; }
  .header-name { font-size: 16pt; font-weight: bold; color: ${safeColor}; }
  .summary { font-size: 9pt; color: #333; line-height: 1.5; }
  .entry { display: flex; gap: 8px; margin-bottom: 8px; }
  .entry-dates { width: 22mm; flex-shrink: 0; font-size: 7.5pt; color: #555; padding-top: 1px; }
  .entry-body { flex: 1; }
  .entry-title { font-weight: bold; font-size: 9pt; }
  .entry-sub { font-size: 8pt; color: #555; margin-bottom: 2px; }
  .entry-desc { font-size: 8pt; color: #333; white-space: pre-wrap; line-height: 1.4; }
  .lang-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  .lang-table th, .lang-table td { border: 1px solid #ccc; padding: 3px 5px; text-align: center; }
  .lang-table thead th { background: ${safeColor}20; color: ${safeColor}; font-weight: bold; font-size: 7.5pt; }
  .lang-table tbody td:first-child { text-align: left; }
  .skills-text { font-size: 8pt; line-height: 1.5; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-inside: avoid; }
    .entry { page-break-inside: avoid; }
  }
</style>
<script>window.onload = function(){ window.print(); }</script>
</head>
<body>
<div class="page">
  <div class="sidebar">
    ${photoSrc}
    <div class="name-block"><div class="full-name">${esc(cv.fullName)}</div></div>
    ${cv.email || cv.phone || cv.address ? `
    <div>
      <div class="sidebar-section-title">Contact</div>
      ${cv.email ? `<div class="contact-item"><strong>Email</strong>${esc(cv.email)}</div>` : ""}
      ${cv.phone ? `<div class="contact-item"><strong>Phone</strong>${esc(cv.phone)}</div>` : ""}
      ${cv.address ? `<div class="contact-item"><strong>Address</strong>${esc(cv.address)}</div>` : ""}
      ${cv.linkedin ? `<div class="contact-item"><strong>LinkedIn</strong>${esc(cv.linkedin)}</div>` : ""}
    </div>` : ""}
    ${cv.dateOfBirth || cv.nationality || cv.gender ? `
    <div>
      <div class="sidebar-section-title">Personal</div>
      ${cv.dateOfBirth ? `<div class="contact-item"><strong>Date of birth</strong>${esc(cv.dateOfBirth)}</div>` : ""}
      ${cv.nationality ? `<div class="contact-item"><strong>Nationality</strong>${esc(cv.nationality)}</div>` : ""}
      ${cv.gender ? `<div class="contact-item"><strong>Gender</strong>${esc(cv.gender)}</div>` : ""}
    </div>` : ""}
    ${cv.digitalSkills ? `
    <div>
      <div class="sidebar-section-title">Digital Skills</div>
      <div class="skills-text">${esc(cv.digitalSkills)}</div>
    </div>` : ""}
    ${cv.drivingLicense ? `
    <div>
      <div class="sidebar-section-title">Driving Licence</div>
      <div class="skills-text">${esc(cv.drivingLicense)}</div>
    </div>` : ""}
    ${cv.hobbies ? `
    <div>
      <div class="sidebar-section-title">Interests</div>
      <div class="skills-text">${esc(cv.hobbies)}</div>
    </div>` : ""}
  </div>
  <div class="main">
    ${decorativeSvg}
    <div class="header-name">${esc(cv.fullName)}</div>
    ${cv.summary ? `
    <div>
      <div class="section-title">About Me</div>
      <div class="summary">${esc(cv.summary)}</div>
    </div>` : ""}
    ${cv.experiences.length ? `
    <div>
      <div class="section-title">Work Experience</div>
      ${expHtml}
    </div>` : ""}
    ${cv.educations.length ? `
    <div>
      <div class="section-title">Education and Training</div>
      ${eduHtml}
    </div>` : ""}
    ${cv.languages.length ? `
    <div>
      <div class="section-title">Language Skills</div>
      ${langHtml}
    </div>` : ""}
  </div>
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `inline; filename="Europass_CV_${cv.fullName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.html"`);
  res.send(html);
});

// GET /cvs/:id/export/word
router.get("/cvs/:id/export/word", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const cv = await loadFullCv(id);
  if (!cv) { res.status(404).json({ error: "CV not found" }); return; }

  const color = hexColor(cv.mainColor || "#003399");

  const sectionHeading = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
      run: { color, bold: true, size: 22, font: "Arial" },
    });

  const labelValue = (label: string, value: string | null | undefined) =>
    value
      ? new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 18, font: "Arial" }),
            new TextRun({ text: value, size: 18, font: "Arial" }),
          ],
          spacing: { after: 40 },
        })
      : null;

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cv.fullName, bold: true, size: 36, color, font: "Arial" })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    })
  );

  // Personal info
  children.push(sectionHeading("Personal Information"));
  const personal = [
    labelValue("Email", cv.email),
    labelValue("Phone", cv.phone),
    labelValue("Address", cv.address),
    labelValue("LinkedIn", cv.linkedin),
    labelValue("Date of Birth", cv.dateOfBirth),
    labelValue("Nationality", cv.nationality),
    labelValue("Gender", cv.gender),
  ].filter(Boolean) as Paragraph[];
  children.push(...personal);

  // Summary
  if (cv.summary) {
    children.push(sectionHeading("About Me"));
    children.push(new Paragraph({ text: cv.summary, spacing: { after: 80 }, run: { size: 18, font: "Arial" } }));
  }

  // Experience
  if (cv.experiences.length) {
    children.push(sectionHeading("Work Experience"));
    for (const e of cv.experiences) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: e.jobTitle, bold: true, size: 20, font: "Arial" })],
          spacing: { before: 100, after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${e.employer}${e.city ? `, ${e.city}` : ""}`, size: 18, font: "Arial", italics: true }),
            new TextRun({ text: `  ${fmtDate(e.startDate)} – ${fmtDate(e.endDate)}`, size: 18, font: "Arial", color: "555555" }),
          ],
          spacing: { after: 40 },
        })
      );
      if (e.description) {
        for (const line of e.description.split("\n")) {
          children.push(new Paragraph({ text: line, spacing: { after: 20 }, run: { size: 18, font: "Arial" } }));
        }
      }
    }
  }

  // Education
  if (cv.educations.length) {
    children.push(sectionHeading("Education and Training"));
    for (const e of cv.educations) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: e.degree, bold: true, size: 20, font: "Arial" })],
          spacing: { before: 100, after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${e.institution}${e.city ? `, ${e.city}` : ""}${e.grade ? ` — ${e.grade}` : ""}`, size: 18, font: "Arial", italics: true }),
            new TextRun({ text: `  ${fmtDate(e.startDate)} – ${fmtDate(e.endDate)}`, size: 18, font: "Arial", color: "555555" }),
          ],
          spacing: { after: 40 },
        })
      );
    }
  }

  // Languages table
  if (cv.languages.length) {
    children.push(sectionHeading("Language Skills"));
    const headerRow = new TableRow({
      children: ["Language", "Listening", "Reading", "Spoken Interaction", "Spoken Production", "Writing"].map(h =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16, font: "Arial", color })] })],
          shading: { type: ShadingType.CLEAR, fill: `${color}20` },
        })
      ),
    });
    const langRows = cv.languages.map(l =>
      new TableRow({
        children: [
          l.languageName,
          l.listening ?? "–",
          l.reading ?? "–",
          l.spokenInteraction ?? "–",
          l.spokenProduction ?? "–",
          l.writing ?? "–",
        ].map(val =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: val, size: 16, font: "Arial" })] })],
          })
        ),
      })
    );
    children.push(
      new Paragraph({ children: [] }), // spacer
      new Table({ rows: [headerRow, ...langRows], width: { size: 100, type: WidthType.PERCENTAGE } }) as unknown as Paragraph
    );
  }

  // Digital skills
  if (cv.digitalSkills) {
    children.push(sectionHeading("Digital Skills"));
    children.push(new Paragraph({ text: cv.digitalSkills, run: { size: 18, font: "Arial" } }));
  }

  // Interests
  if (cv.hobbies) {
    children.push(sectionHeading("Interests and Hobbies"));
    children.push(new Paragraph({ text: cv.hobbies, run: { size: 18, font: "Arial" } }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `Europass_CV_${cv.fullName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.docx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});

export default router;
