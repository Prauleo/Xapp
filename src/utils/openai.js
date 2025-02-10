import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generarTweetsAutomaticos(contexto, cuenta) {
  try {
    const prompt = `
      Actúa como un experto en creación de contenido para Twitter.
      
      Contexto de la cuenta:
      - Nombre: ${cuenta.nombre}
      - Tono: ${cuenta.tono}
      - Estilo: ${cuenta.estilo_visual || 'minimalista'}
      - Público objetivo: ${cuenta.publico_objetivo || 'general'}

      Basado en el siguiente contexto:
      ${contexto}

      Genera 3 tweets que:
      1. Mantengan el tono ${cuenta.tono} especificado
      2. Sean relevantes para el contexto proporcionado
      3. Tengan máximo 280 caracteres
      4. Sean atractivos y generen engagement
      5. No incluyan hashtags, solo texto puro

      Formato de respuesta:
      - Un tweet por línea
      - Sin numeración ni viñetas
      - Sin comillas ni otros caracteres especiales
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    // Procesamos la respuesta para obtener los tweets individuales
    const tweets = response.choices[0].message.content
      .split('\n')
      .filter(tweet => tweet.trim().length > 0)
      .slice(0, 3); // Nos aseguramos de tomar solo 3 tweets

    return tweets;
  } catch (error) {
    console.error('Error generando tweets:', error);
    throw new Error('No se pudieron generar los tweets. Por favor, intenta de nuevo.');
  }
}

export async function generarIdeas(tono, ejemplos) {
  // Aquí iría el código para generar ideas, pero por ahora solo definimos la función.
}
