import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;
const allowedOrigins = (process.env.ACTAI_ALLOWED_ORIGINS || "https://ffzit37-commits.github.io,http://localhost:3000")
  .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by Actai API"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "32kb" }));

const requestCounts = new Map();
app.use("/api", (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = requestCounts.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + 60_000; }
  entry.count += 1;
  requestCounts.set(key, entry);
  if (entry.count > 30) return res.status(429).json({ error: "طلبات كثيرة. حاول بعد دقيقة." });
  next();
});

app.get("/", (_req, res) => res.json({ name: "Actai API", status: "online" }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "actai-api" }));

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "اكتب طلبك أولاً." });
  if (message.length > 20_000) return res.status(413).json({ error: "الطلب طويل جدًا. اختصره قليلًا." });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "الخادم جاهز، لكن لم تتم إضافة مفتاح مزود الذكاء الاصطناعي في Render بعد." });

  const model = process.env.OPENROUTER_MODEL || "openrouter/auto";
  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ffzit37-commits.github.io/Actai/",
        "X-Title": "Actai"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "أنت Actai، مساعد عربي متعدد المهام. افهم طلب المستخدم وحدد أفضل طريقة لمساعدته. أجب باللغة التي يستخدمها. كن واضحًا وعمليًا، ولا تدّع تنفيذ أعمال أو إنشاء ملفات لم تنفذها فعليًا. إذا كان الطلب يحتاج أداة أو قدرة غير متاحة، وضح ذلك واقترح الخطوة الممكنة." },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail = data?.error?.message || "مزود الذكاء الاصطناعي لم يقبل الطلب.";
      return res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502).json({ error: detail });
    }
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: "لم يصل رد صالح من نموذج الذكاء الاصطناعي." });
    return res.json({ reply, model: data.model || model, provider: "openrouter" });
  } catch (error) {
    console.error("Actai provider error:", error.message);
    return res.status(502).json({ error: "تعذر الوصول إلى مزود الذكاء الاصطناعي الآن. حاول مجددًا." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Actai API listening on ${PORT}`));
