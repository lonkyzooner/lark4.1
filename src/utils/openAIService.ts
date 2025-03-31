// Get API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ""

export async function queryOpenAI(prompt: string, emotion = "neutral"): Promise<string> {
  try {
    console.log("Sending query to OpenAI:", prompt)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are LARK (Law Enforcement Assistance and Response Kit), an AI assistant for police officers in Louisiana. Provide concise, accurate information about Louisiana laws, procedures, and assist officers in the field. Keep responses brief and professional.

The user's detected emotional state is: ${emotion}. Adjust your tone accordingly while maintaining professionalism.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenAI API error:", errorData)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content.trim()

    console.log("OpenAI response:", aiResponse)
    return aiResponse
  } catch (error) {
    console.error("Error querying OpenAI:", error)
    return "Unable to process your request at this time. Please try again later."
  }
}

