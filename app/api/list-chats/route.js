// /api/list-chats.js
import fs from "fs";
import path from "path";

const SAVE_DIR = path.join(process.cwd(), "saved_chats");

export async function GET() {
  try {
    if (!fs.existsSync(SAVE_DIR)) {
      fs.mkdirSync(SAVE_DIR, { recursive: true });
    }

    const files = fs.readdirSync(SAVE_DIR).filter((f) => f.endsWith(".json"));
    const chats = files.map((file) => {
      const data = JSON.parse(
        fs.readFileSync(path.join(SAVE_DIR, file), "utf8")
      );
      return {
        id: data.id,
        title: data.title,
        date: new Date(parseInt(data.id)).toLocaleString(), // id is timestamp
      };
    });

    return new Response(JSON.stringify(chats), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
