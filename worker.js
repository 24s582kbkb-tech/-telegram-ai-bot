const BOT_TOKEN = "8233740982:AAHQyOqaXirTJrO8plOH0QPgMpvuDG2oBSQ";
const HF_TOKEN = "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";
export default {
  async fetch(request, env) {
    try {
      const update = await request.json();
      // ==============================
      // INLINE MODE
      // @@iishka_otvet_bot вопрос
      // ==============================
      if (update.inline_query) {
        const query = update.inline_query.query.trim();
        // Если вопрос пустой
        if (!query) {
          await answerInlineQuery(
            update.inline_query.id,
            []
          );
          return new Response("OK");
        }
        // Получаем варианты ответов от AI
        const answers = await askAI(query);
        // Создаём варианты для Telegram
        const results = answers.map((answer, index) => ({
          type: "article",
          id: String(index + 1),
          title: `Вариант ${index + 1}`,
          description: answer,
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
      // ОБЫЧНЫЕ СООБЩЕНИЯ БОТУ
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
            "Привет! 🤖\n\nЧтобы использовать меня в любом чате, напиши:\n\n@иибот твой вопрос"
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
// AI — создаёт 5 вариантов ответа
// ========================================
async function askAI(question) {
  const prompt = `
Ты помощник для переписки в Telegram.
Пользователь задал вопрос:
"${question}"
Дай 5 разных вариантов ответа.
ВАЖНО:
- Каждый вариант должен быть самостоятельным готовым сообщением.
- Ответы должны быть естественными.
- Не добавляй номера перед вариантами.
- Не пиши объяснения от себя.
- Каждый вариант отделяй строкой:
---
- Варианты должны быть разными по стилю.
- Один вариант сделай коротким.
- Один — подробным.
- Один — максимально простым.
- Один — более уверенным.
- Один — нейтральным.
Верни только 5 вариантов.
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
        model: "openai/gpt-oss-120b",
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
  // Если Hugging Face вернул ошибку
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
  // Разделяем 5 вариантов
  const answers = content
    .split("---")
    .map(text => text.trim())
    .filter(text => text.length > 0);
  // На случай если AI вернул меньше вариантов
  if (answers.length === 0) {
    return [
      content.trim()
    ];
  }
  // Максимум 5 вариантов
  return answers.slice(0, 5);
}
// ========================================
// Telegram — отправляем варианты
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
// Telegram — обычное сообщение
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
