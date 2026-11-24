const MODEL = "gemini-2.5-flash-lite";
const MAX_CHARS = 50000;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sirf POST allowed hai." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = ((body && body.text) || "").trim();
  const lang = (body && body.lang) || "Roman Urdu";

  if (!text) return res.status(400).json({ error: "Pehle text paste karein." });
  if (text.length > MAX_CHARS) {
    return res.status(400).json({ error: `Text ${MAX_CHARS} characters se lamba hai.` });
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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: (data.error && data.error.message) || "API mein masla aaya." });
    }

    const summary = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("");

    if (!summary) {
      return res.status(500).json({ error: "AI ne khali jawab diya. Dobara try karein." });
    }

    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ error: "Server par masla aaya: " + err.message });
  }
};
