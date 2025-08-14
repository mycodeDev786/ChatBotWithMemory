import fs from "fs";
import path from "path";

const SAVE_DIR = path.join(process.cwd(), "saved_chats");
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR);

export async function POST(req) {
  try {
    const { chat } = await req.json();
    const filePath = path.join(SAVE_DIR, `${chat.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(chat, null, 2), "utf8");
    return new Response(
      JSON.stringify({ message: "Chat saved successfully!" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
