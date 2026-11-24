const MODEL = "claude-haiku-5-5";
const MAX_CHARS = 20000;

function respond(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Sirf POST allowed hai." });
  }

  let text = "";
  let lang = "Roman Urdu";
  try {
    const body = JSON.parse(event.body || "{}");
    text = (body.text || "").trim();
    lang = body.lang || "Roman Urdu";
  } catch {
    return respond(400, { error: "Request theek nahi hai." });
  }

  if (!text) return respond(400, { error: "Pehle text paste karein." });
  if (text.length > MAX_CHARS) {
    return respond(400, { error: `Text ${MAX_CHARS} characters se lamba hai.` });
  }

  const prompt =
    `Neeche diye gaye text ka khulasa ${lang} mein likhein.\n` +
    "Format:\n" +
    "1. Ek line mein main idea.\n" +
    "2. 5 short bullet points mein important baatein.\n" +
    "3. Agar koi action item ya date ho to alag line mein likhein.\n" +
    "Sirf khulasa dein, koi extra introduction na likhein.\n\n" +
    `TEXT:\n${text}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return respond(500, { error: data.error?.message || "API mein masla aaya." });
    }

    const summary = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return respond(200, { summary });
  } catch (err) {
    return respond(500, { error: "Server par masla aaya: " + err.message });
  }
};
