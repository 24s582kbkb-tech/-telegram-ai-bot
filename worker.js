const BOT_TOKEN = "8233740982:AAHQyOqaXirTJrO8plOH0QPgMpvuDG2oBSQ";
const HF_TOKEN = "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";

export default {
  async fetch(request, env) {
    try {
      const update = await request.json();

      // ==============================
      // INLINE MODE
      // @iishka_otvet_bot вопрос
      // ==============================

      if (update.inline_query) {
        const query = update.inline_query.query.trim();

        if (!query) {
          await answerInlineQuery(
            update.inline_query.id,
            []
          );

          return new Response("OK");
        }

        const answers = await askAI(query);

        const results = answers.map((answer, index) => ({
          type: "article",
          id: String(index + 1),

          title: `Вариант ${index + 1}`,

          description: answer.slice(0, 200),

          input_message_content: {
            message_text: answer
          }
        }));

        await answerInlineQuery(
          update.inline_query.id,
          results
        );

        return new Response("OK");
      }

      // ==============================
      // ОБЫЧНЫЕ СООБЩЕНИЯ
      // ==============================

      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (!text) {
          return new Response("OK");
        }

        if (text === "/start") {
          await sendTelegramMessage(
            chatId,
            "Привет! 🤖\n\nИспользуй меня в любом чате:\n\n@iishka_otvet_bot твой вопрос"
          );

          return new Response("OK");
        }

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


// ========================================
// AI
// ========================================

async function askAI(question) {

  const prompt = `
Ты помощник для переписки в Telegram.

Пользователь спрашивает:

"${question}"

Создай 5 разных готовых вариантов ответа.

Правила:
- Каждый вариант должен быть самостоятельным сообщением.
- Не добавляй номера.
- Не добавляй объяснения.
- Не используй слово "Вариант".
- Каждый ответ отделяй строкой ---
- Ответы должны быть естественными.
- Сделай варианты разными по стилю:
  1. короткий
  2. подробный
  3. простой
  4. уверенный
  5. нейтральный

Верни только эти 5 вариантов.
`;

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: "openai/gpt-oss-120b:fastest",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ],

        max_tokens: 1000
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();

    console.log(
      "Hugging Face error:",
      error
    );

    return [
      "Не удалось получить ответ от AI 😔"
    ];
  }

  const data = await response.json();

  const content =
    data.choices?.[0]?.message?.content;

  if (!content) {
    return [
      "AI не смог сформировать ответ 😔"
    ];
  }

  const answers = content
    .split("---")
    .map(text => text.trim())
    .filter(text => text.length > 0);

  if (answers.length === 0) {
    return [
      content.trim()
    ];
  }

  return answers.slice(0, 5);
}


// ========================================
// TELEGRAM — INLINE
// ========================================

async function answerInlineQuery(
  inlineQueryId,
  results
) {
  await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/answerInlineQuery`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        inline_query_id: inlineQueryId,
        results: results,
        cache_time: 0,
        is_personal: true
      })
    }
  );
}


// ========================================
// TELEGRAM — обычное сообщение
// ========================================

async function sendTelegramMessage(
  chatId,
  text
) {
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
