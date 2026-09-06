const BOT_TOKEN = "8233740982:AAHQyOqaXirTJrO8plOH0QPgMpvuDG2oBSQ";
const HF_TOKEN = "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";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Telegram AI bot is running!");
    }

    try {
      const update = await request.json();

      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (!text) {
          return new Response("OK");
        }

        if (text === "/start") {
          await sendTelegramMessage(
            chatId,
            "Привет! 🤖 Я AI-бот. Напиши мне что-нибудь!"
          );

          return new Response("OK");
        }

        const response = await fetch(
          "https://router.huggingface.co/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HF_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
  model: "openai/gpt-oss-120b",
              messages: [
                {
                  role: "user",
                  content: text
                }
              ],
              max_tokens: 500
            })
          }
        );

        if (!response.ok) {
          const error = await response.text();
          console.log("Hugging Face error:", error);

          await sendTelegramMessage(
            chatId,
            "Ошибка Hugging Face: " + error

  );

          return new Response("OK");
        }

        const data = await response.json();

        const answer =
          data.choices?.[0]?.message?.content ||
          "Я не смог придумать ответ 😔";

        await sendTelegramMessage(chatId, answer);

        return new Response("OK");
      }

      return new Response("OK");

    } catch (error) {
      console.log("Worker error:", error);

      return new Response("Internal Server Error", {
        status: 500
      });
    }
  }
};

async function sendTelegramMessage(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    }
  );
}
