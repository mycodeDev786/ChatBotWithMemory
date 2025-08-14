import OpenAI from "openai";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MEMORY_FILE = path.join(process.cwd(), "memory.json");

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), "utf8");
}

async function extractPdfText(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    let text = "(PDF text extraction placeholder — implement parser)";
    return text;
  } catch {
    return "⚠ Unable to read PDF content.";
  }
}

async function processFile(fileData, fileName) {
  const [mimeType, base64] = fileData.split(";base64,");
  const buffer = Buffer.from(base64, "base64");
  const fileType = mimeType.replace("data:", "");

  if (fileType.startsWith("image/")) {
    return { type: "image_url", image_url: { url: fileData } };
  } else if (fileType === "application/pdf") {
    const pdfText = await extractPdfText(buffer);
    return {
      type: "text",
      text: `Contents of PDF:\n\n${pdfText.slice(0, 8000)}`,
    };
  } else if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      type: "text",
      text: `Contents of Word document:\n\n${(result.value || "").slice(
        0,
        8000
      )}`,
    };
  } else if (fileType.startsWith("text/")) {
    const text = buffer.toString("utf8");
    return {
      type: "text",
      text: `Contents of text file:\n\n${text.slice(0, 8000)}`,
    };
  } else {
    return {
      type: "text",
      text: `User uploaded a file (${fileName}), format not supported.`,
    };
  }
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const memory = loadMemory();

    const openaiMessages = [
      {
        role: "system",
        content: `You have long-term memory of past questions:\n${memory
          .map((m) => `- ${m.topic}: ${m.summary}`)
          .join("\n")}`,
      },
    ];

    for (const msg of messages) {
      if (msg.role === "user") {
        const content = [];
        if (msg.content) content.push({ type: "text", text: msg.content });
        if (msg.file) content.push(await processFile(msg.file, msg.fileName));
        openaiMessages.push({ role: "user", content });
      } else {
        openaiMessages.push({
          role: "assistant",
          content: [{ type: "text", text: msg.content }],
        });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
    });

    const reply = completion.choices[0].message.content;

    // Summarize the user's question for memory
    const summaryPrompt = [
      {
        role: "system",
        content:
          "Summarize the following question into 1 short sentence for future memory.",
      },
      { role: "user", content: messages[messages.length - 1].content },
    ];
    const summaryRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: summaryPrompt,
    });

    memory.push({
      topic: messages[messages.length - 1].content.slice(0, 50),
      summary: summaryRes.choices[0].message.content,
      timestamp: new Date().toISOString(),
    });

    saveMemory(memory);

    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch AI response" }),
      { status: 500 }
    );
  }
}
