import jsPDF from "jspdf";

export interface PdfSection {
  heading: string;
  body: string;
  visible: boolean;
}

export function generateCareerPdf(
  userName: string,
  title: string,
  sections: PdfSection[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let y = 30;

  // Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("RIZMANGO", margin, y);
  y += 15;

  // Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: "center" });
  y += titleLines.length * 12 + 5;

  // Personalization
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Prepared for: ${userName}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Divider
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Sections
  const visibleSections = sections.filter((s) => s.visible);
  for (const section of visibleSections) {
    if (y > 260) {
      doc.addPage();
      y = 25;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(section.heading, margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const bodyLines = doc.splitTextToSize(section.body, contentWidth);
    for (const line of bodyLines) {
      if (y > 275) {
        doc.addPage();
        y = 25;
      }
      doc.text(line, margin, y);
      y += 6;
    }
    y += 10;
  }

  return doc;
}
