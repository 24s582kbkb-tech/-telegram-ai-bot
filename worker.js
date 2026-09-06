export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Telegram AI bot is running!");
    }

    try {
      const update = await request.json();

      // Telegram inline query
      if (update.inline_query) {
        const query = update.inline_query.query.trim();

        if (!query) {
          return new Response("OK");
        }

        // Запрос к Hugging Face
        const hfResponse = await fetch(
          "https://router.huggingface.co/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.HF_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b:fastest",
              messages: [
                {
                  role: "system",
                  content:
                    "Ты полезный русскоязычный помощник. Отвечай понятно, кратко и по существу."
                },
                {
                  role: "user",
                  content: query
                }
              ],
              stream: false
            })
          }
        );

        const data = await hfResponse.json();

        const answer =
          data?.choices?.[0]?.message?.content ||
          "Не удалось получить ответ от AI.";

        // Отправляем результат обратно в Telegram
        await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerInlineQuery`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inline_query_id: update.inline_query.id,
              results: [
                {
                  type: "article",
                  id: crypto.randomUUID(),
                  title: "Ответ AI",
                  description: answer.slice(0, 200),
                  input_message_content: {
                    message_text: answer
                  }
                }
              ],
              cache_time: 0,
              is_personal: true
            })
          }
        );

        return new Response("OK");
      }

      return new Response("OK");
    } catch (error) {
      console.error(error);
      return new Response("OK");
    }
  }
};
