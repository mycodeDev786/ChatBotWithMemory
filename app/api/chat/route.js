import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";
import { Buffer } from "buffer";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractPdfText(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    let text =
      "(PDF text extraction placeholder — implement parser for accuracy)";
    return text;
  } catch (err) {
    console.error("PDF parse error:", err);
    return "⚠ Unable to read PDF content.";
  }
}

async function processFile(fileData, fileName) {
  const [mimeType, base64] = fileData.split(";base64,");
  const buffer = Buffer.from(base64, "base64");
  const fileType = mimeType.replace("data:", "");

  if (fileType.startsWith("image/")) {
    return {
      type: "image_url",
      image_url: { url: fileData },
    };
  } else if (fileType === "application/pdf") {
    const pdfText = await extractPdfText(buffer);
    return {
      type: "text",
      text: `Contents of the uploaded PDF:\n\n${pdfText.slice(0, 8000)}`,
    };
  } else if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      type: "text",
      text: `Contents of the uploaded Word document:\n\n${(
        result.value || ""
      ).slice(0, 8000)}`,
    };
  } else if (fileType.startsWith("text/")) {
    const text = buffer.toString("utf8");
    return {
      type: "text",
      text: `Contents of the uploaded text file:\n\n${text.slice(0, 8000)}`,
    };
  } else {
    return {
      type: "text",
      text: `User uploaded a file (${fileName}), but this format is not supported for analysis.`,
    };
  }
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const openaiMessages = [];

    // Construct the OpenAI message payload from the entire chat history
    for (const msg of messages) {
      if (msg.role === "user") {
        const content = [];
        if (msg.content) {
          content.push({ type: "text", text: msg.content });
        }
        if (msg.file) {
          content.push(await processFile(msg.file, msg.fileName));
        }
        openaiMessages.push({ role: "user", content: content });
      } else {
        // Push assistant's message directly
        openaiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
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
