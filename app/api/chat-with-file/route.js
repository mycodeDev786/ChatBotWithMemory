import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) return reject(err);

      const filePath = files.file.filepath;

      try {
        // Upload file to OpenAI
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: "assistants", // use "answers" if using old API
        });

        // Ask question about the file
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that answers questions based on an uploaded document.",
            },
            {
              role: "user",
              content: `Please summarize the uploaded document.`,
            },
          ],
        });

        resolve(
          new Response(
            JSON.stringify({ reply: response.choices[0].message.content }),
            {
              status: 200,
            }
          )
        );
      } catch (error) {
        console.error(error);
        resolve(
          new Response(JSON.stringify({ error: "Failed to process file" }), {
            status: 500,
          })
        );
      }
    });
  });
}
