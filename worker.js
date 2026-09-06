export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Telegram AI bot is running!");
    }

    try {
      const update = await request.json();

      // Telegram inline query
      if (update.inline_query) {
        const query =
