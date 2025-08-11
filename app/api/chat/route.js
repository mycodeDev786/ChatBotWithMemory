import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple PDF text extractor (no fs)
async function extractPdfText(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    let text = "";
    // pdf-lib doesn't extract text natively, so this is placeholder
    // For better accuracy, replace with a minimal parser if needed
    text = "(PDF text extraction placeholder — implement parser for accuracy)";
    return text;
  } catch (err) {
    console.error("PDF parse error:", err);
    return "⚠ Unable to read PDF content.";
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") || "";
    const file = formData.get("file");

    const messagesPayload = [];

    if (message.trim()) {
      messagesPayload.push({ type: "text", text: message });
    }

    if (file && file.name) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type.startsWith("image/")) {
        // Image handling
        const base64 = buffer.toString("base64");
        const imageUrl = `data:${file.type};base64,${base64}`;
        messagesPayload.push({
          type: "image_url",
          image_url: { url: imageUrl },
        });
      } else if (file.type === "application/pdf") {
        // PDF handling
        const pdfText = await extractPdfText(buffer);
        messagesPayload.push({
          type: "text",
          text: `Contents of the uploaded PDF:\n\n${pdfText.slice(0, 8000)}`,
        });
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword"
      ) {
        // DOCX handling
        const result = await mammoth.extractRawText({ buffer });
        messagesPayload.push({
          type: "text",
          text: `Contents of the uploaded Word document:\n\n${(
            result.value || ""
          ).slice(0, 8000)}`,
        });
      } else if (file.type.startsWith("text/")) {
        // Plain text handling
        const text = buffer.toString("utf8");
        messagesPayload.push({
          type: "text",
          text: `Contents of the uploaded text file:\n\n${text.slice(0, 8000)}`,
        });
      } else {
        messagesPayload.push({
          type: "text",
          text: `User uploaded a file (${file.name}), but this format is not supported for analysis.`,
        });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: messagesPayload }],
    });

    return new Response(
      JSON.stringify({ reply: completion.choices[0].message.content }),
      { status: 200 }
    );
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch AI response" }),
      { status: 500 }
    );
  }
}
