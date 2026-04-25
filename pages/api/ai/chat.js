export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { message } = req.body;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `You are FoodRescue AI. Answer this query concisely: "${message}"`,
        }),
      }
    );

    const data = await response.json();
    const reply = Array.isArray(data) ? data[0]?.generated_text : (data?.generated_text || "I'm processing that...");

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ reply: "Connection lost to AI core. Still here to help!" });
  }
}
