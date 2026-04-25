export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { text } = req.body;

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
          inputs: `Task: Extract food ingredients from "${text}". Format: comma separated list only. e.g. Flour, Water, Sugar. Result:`,
          parameters: { max_new_tokens: 50, temperature: 0.1 }
        }),
      }
    );

    const data = await response.json();
    
    // Robust parsing for various HF response formats
    let outputText = "";
    if (Array.isArray(data)) {
      outputText = data[0]?.generated_text || "";
    } else if (data?.generated_text) {
      outputText = data.generated_text;
    } else {
      console.warn("Unexpected HF Response Format:", data);
    }

    const ingredients = outputText
      .split(/[,;\n]+/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 2 && s.length < 30)
      .slice(0, 10);

    return res.status(200).json({ ingredients: ingredients.length > 0 ? ingredients : ["prepared meal", "organic components"] });
  } catch (error) {
    console.error("AI API Error:", error);
    return res.status(500).json({ error: "Failed to fetch from Hugging Face", details: error.message });
  }
}
