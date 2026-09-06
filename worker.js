export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Telegram AI bot is running!");
    }

    try {
      const update = await request.json();

      // Обычное сообщение
      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (!text) {
          return new Response("OK");
        }

        // Команда /start
        if (text === "/start") {
          await sendTelegramMessage(
            env.BOT_TOKEN,
            const BOT_TOKEN = "8233740982:AAHQyOqaXirTJrO8plOH0QPgMpvuDG2oBSQ";
            chatId,
            "Привет! 🤖 Я AI-бот. Напиши мне что-нибудь!"
          );

          return new Response("OK");
        }

        // Запрос к Hugging Face
        const response = await fetch(
          "https://router.huggingface.co/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.HF_TOKEN}`,
              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
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b:fastest",
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
            env.BOT_TOKEN,
            const BOT_TOKEN = "8233740982:AAHQyOqaXirTJrO8plOH0QPgMpvuDG2oBSQ";
            chatId,
            "Извини, сейчас я не могу ответить 😔"
          );

          return new Response("OK");
        }

        const data = await response.json();

        const answer =
          data.choices?.[0]?.message?.content ||
          "Я не смог придумать ответ 😔";

        await sendTelegramMessage(
          env.BOT_TOKEN,
          const BOT_TOKEN = "8233740982:AAHQyOqaXirTJrO8plOH0QPgMpvuDG2oBSQ";
          chatId,
          answer
        );

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


async function sendTelegramMessage(token, chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
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
