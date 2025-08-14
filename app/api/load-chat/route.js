// /api/load-chat.js
import fs from "fs";
import path from "path";

const SAVE_DIR = path.join(process.cwd(), "saved_chats");

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("id");

  try {
    const filePath = path.join(SAVE_DIR, `${chatId}.json`);
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
      });
    }
    const data = fs.readFileSync(filePath, "utf8");
    return new Response(data, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
