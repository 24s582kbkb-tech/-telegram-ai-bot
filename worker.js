export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Telegram AI bot is running!");
    }

    try {
      const update = await request.json();

      // Обработка сообщений от Telegram
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
            chatId,
            "Привет! 🤖 Я AI-бот. Напиши мне что-нибудь!"
          );

          return new Response("OK");
        }

        // Запрос к OpenAI
        const openaiResponse = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
              input: text
            })
          }
        );

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();

          await sendTelegramMessage(
            env.BOT_TOKEN,
            chatId,
            "Ошибка AI-сервиса 😔"
          );

          console.log(errorText);
          return new Response("OK");
        }

        const data = await openaiResponse.json();

        const answer =
          data.output_text ||
          "Я не смог получить ответ 😔";

        await sendTelegramMessage(
          env.BOT_TOKEN,
          chatId,
          answer
        );

        return new Response("OK");
      }

      // Telegram inline query
      if (update.inline_query) {
        const inlineQueryId = update.inline_query.id;
        const query = update.inline_query.query;

        if (!query) {
          return new Response("OK");
        }

        const openaiResponse = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
              input: query
            })
          }
        );

        if (!openaiResponse.ok) {
          return new Response("OK");
        }

        const data = await openaiResponse.json();

        const answer =
          data.output_text ||
          "Не удалось получить ответ.";

        await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/answerInlineQuery`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inline_query_id: inlineQueryId,
              results: [
                {
                  type: "article",
                  id: "1",
                  title: "Ответ AI",
                  description: answer.slice(0, 100),
                  input_message_content: {
                    message_text: answer
                  }
                }
              ],
              cache_time: 0
            })
          }
        );

        return new Response("OK");
      }

      return new Response("OK");
    } catch (error) {
      console.log(error);
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
