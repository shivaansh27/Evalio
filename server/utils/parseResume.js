import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const getExtension = (filePath = "") =>
  path.extname(filePath).toLowerCase();

export async function parseResumeFile(filePath) {
  const ext = getExtension(filePath);

  if (ext === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return (result?.text || "").trim();
    } finally {
      await parser.destroy().catch(() => null);
    }
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return (result.value || "").trim();
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}
