import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generarTweetsAutomaticos(contextoCompleto, cuenta) {
  try {
    const prompt = `
      Actúa como un experto en creación de contenido para Twitter.
      
      INSTRUCCIONES PRINCIPALES (${cuenta.idioma.toUpperCase()}):
      1. Estilo visual: ${cuenta.estilo_visual}
      2. Tono: ${cuenta.tono}
      
      IDEAS DEL USUARIO (MAXIMA PRIORIDAD):
      ${contextoCompleto.ideas}

      CONTEXTO COMPLEMENTARIO:
      ${contextoCompleto.contexto}

      Generar 3 tweets en ${cuenta.idioma === 'es' ? 'español' : 'inglés'} que:
      - Se ajusten al estilo visual
      - Mantengan el tono especificado
      - Reflejen principalmente las ideas del usuario
      - Tengan máximo 280 caracteres
      - Sean atractivos y generen engagement
      - No incluyan hashtags, solo texto puro

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
