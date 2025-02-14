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

export async function analizarTweet(tweet, account) {
  try {
    const prompt = `  
Act as a computational linguist specializing in social media communication pattern decomposition. Your task is to create an executable style replication blueprint from user-generated content.

REQUIRED ANALYSIS (categorized breakdown):
------------------
SAMPLE TWEET: "${tweet}"
BASE TONE: ${account.tone}

1. Tone & Emotion:
   - Emotional layering (ironic sincerity, passionate detachment)
   - Modality mix (declarative % vs interrogative % vs imperative %)
   - Amplification markers (adverbial density, punctuation clusters)

2. Lexical DNA:
   - Vocabulary stratification (technicality scale 1-5, colloquial index)
   - Semantic fingerprints (3-5 root terms + derivatives)
   - Vernacular markers (platform-specific slang, regional code-switching)
   - Lexical innovation (portmanteaus, semantic recalibrations)

3. Syntactic Architecture:
   - Sentence length distribution (bursts vs sustained structures)
   - Connector ecology (simple vs complex discourse markers)
   - Preferred clause arrangements (SVO prevalence, inversion patterns)
   - Prosodic notation (comma placement logic, dash hierarchy)

4. Rhetorical Machinery:
   - Metaphor matrix (conceptual blending patterns)
   - Repetition algorithms (anaphora frequency, parallel structure ratio)
   - Persuasion circuitry (ethos/pathos/logos balance)

5. Pragmatic Framework:
   - Speech act classification (representative/expressive/directive)
   - Audience positioning (in-group signaling devices)
   - Intertextual anchors (memes, trending reference integration)

6. Idiosyncratic Signatures:
   - Phonetic residues (alliteration patterns, rhythmic cadence)
   - Emoji semiotics (positional meaning, combinatorial logic)
   - Engagement triggers (call-to-action typology)

OUTPUT TEMPLATE:
------------------
[Core Style Profile]  
${account.tone} with [substyle layer] undertones (e.g., "Professional with meme-literate edge")

[Lexical Blueprint]  
- Root terms: [3-5 semantic anchors]  
- Derivative patterns: [morphological transformations]  
- Contextual adapters: [slang activation contexts]

[Syntactic OS]  
- Sentence engine: [e.g., "Burst phrasing with trailing modifiers"]  
- Connector syntax: [e.g., "But → though → however progression"]  
- Punctuation grammar: [e.g., "Strategic interrobang clusters"]

[Rhetorical Toolkit]  
1. [Technique]: [text excerpt demonstration]  
2. [Technique]: [text excerpt demonstration]  

[Replication Protocol]  
1. Blend [X%] of [element A] with [Y%] of [element B] when [context condition]  
2. Apply [specific structure] for [intended effect]  
3. Avoid [counter-style elements] in [defined scenarios]  
4. Amplify [key feature] through [technical method]  

[Style Transfer Test]  
Input: [Neutral phrase]  
Output: [Style-mapped version] (demonstrate transformation logic)  
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing tweet:', error);
    throw new Error('Could not analyze the tweet. Please try again.');
  }
}
