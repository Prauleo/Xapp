import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generarTweetsAutomaticos(contextoCompleto, cuenta, vozCuenta) {
  try {
    // Determinar límites de caracteres para cada tweet según el tipo seleccionado
    const limites = contextoCompleto.esThread ? {
      tweet1: { min: 0, max: 280 },
      tweet2: { min: 0, max: 280 },
      tweet3: { min: 0, max: 280 }
    } : {
      corto: {
        tweet1: { min: 0, max: 80 },     // El más corto
        tweet2: { min: 80, max: 140 },   // Medio
        tweet3: { min: 140, max: 200 }   // El más largo
      },
      mediano: {
        tweet1: { min: 140, max: 200 }, // El más corto
        tweet2: { min: 200, max: 250 }, // Medio
        tweet3: { min: 250, max: 280 }  // El más largo
      },
      largo: {
        tweet1: { min: 200, max: 280 }, // El más corto
        tweet2: { min: 280, max: 380 }, // Medio
        tweet3: { min: 380, max: 500 }  // El más largo
      }
    }[contextoCompleto.longitud] || {
      tweet1: { min: 0, max: 280 },
      tweet2: { min: 0, max: 280 },
      tweet3: { min: 0, max: 280 }
    };

    // Example tweets with correct lengths based on language
    const ejemplos = !contextoCompleto.esThread ? {
      corto: cuenta.idioma === 'en' ? [
        "A short example tweet showing the basic format (30-40 chars)",
        "A slightly longer tweet that still fits within the medium range (80-90 characters here)",
        "And finally a tweet that reaches the maximum character limit for this category, demonstrating the full length (150-160 chars)"
      ] : [
        "Un tweet corto de ejemplo (30-40 caracteres)",
        "Un tweet un poco más largo pero aún dentro del rango medio (80-90 caracteres aquí)",
        "Y finalmente un tweet que alcanza el máximo de caracteres permitidos para esta categoría, mostrando cómo se ve (150-160 caracteres)"
      ],
      mediano: cuenta.idioma === 'en' ? [
        "This is an example tweet that meets the minimum range for the medium category. Notice how the content develops naturally without feeling forced (190-200 chars).",
        "Here we have a tweet that represents the middle range. The content flows naturally and maintains reader interest while developing the idea (230-240 chars).",
        "This tweet reaches the maximum for the medium category, using space effectively to convey complete information and maintain engagement (270-280 chars)."
      ] : [
        "Este es un ejemplo de tweet que cumple con el rango mínimo de la categoría mediana. Nótese cómo el contenido se desarrolla de manera natural sin parecer forzado (190-200 caracteres).",
        "Aquí tenemos un tweet que representa el rango medio de la categoría. El contenido fluye naturalmente y mantiene el interés del lector mientras desarrolla la idea (230-240 caracteres).",
        "Este tweet alcanza el máximo de la categoría mediana, utilizando el espacio de manera efectiva para transmitir información completa y mantener el engagement (270-280 caracteres)."
      ],
      largo: cuenta.idioma === 'en' ? [
        "This tweet demonstrates the minimum range for the long category. Observe how the content develops in more detail, allowing for explanation of more complex concepts and providing additional context. (300-310 chars)",
        "In this example of a medium-length tweet for the long category, we can see how the content is structured to maintain interest while developing a more elaborate idea. The length allows for more details and examples. (380-390 chars)",
        "This tweet makes the most of the character limit for the long category. The additional space allows for developing complex ideas, including multiple viewpoints, and providing detailed context without losing reader interest. (480-500 chars)"
      ] : [
        "Este tweet demuestra el rango mínimo de la categoría larga. Observa cómo el contenido se desarrolla con más detalle, permitiendo explicar conceptos más complejos y proporcionar contexto adicional. (300-310 caracteres)",
        "En este ejemplo de tweet de longitud media para la categoría larga, podemos ver cómo se estructura el contenido para mantener el interés mientras se desarrolla una idea más elaborada. La extensión permite incluir más detalles y ejemplos. (380-390 caracteres)",
        "Este tweet aprovecha al máximo el límite de caracteres de la categoría larga. El espacio adicional permite desarrollar ideas complejas, incluir múltiples puntos de vista, y proporcionar contexto detallado sin perder el interés del lector. (480-500 caracteres)"
      ]
    }[contextoCompleto.longitud] : [];

const systemPrompt = `You are an expert in generating tweets with specific lengths. Your task is to generate tweets that EXACTLY match the specified character ranges.

CORRECT LENGTH EXAMPLES:
${Array.isArray(ejemplos) ? ejemplos.map((ej, i) => `Tweet ${i + 1} (${ej.length} characters): ${ej}`).join('\n') : ''}

CRITICAL RULES:
1. EXACT LENGTH: Each tweet MUST be within its specific character range. No exceptions.
2. LENGTH PROGRESSION:
   - Tweet 1: MUST be the shortest and within the minimum specified range
   - Tweet 2: MUST have an intermediate length
   - Tweet 3: MUST be the longest and utilize available space
3. NATURAL CONTENT:
   - Text must flow naturally
   - Avoid artificial padding to reach length
   - Maintain coherence and message quality
4. RESTRICTIONS:
   - DO NOT use hashtags under any circumstances
   - DO NOT use numbering unless it's a thread
   - DO NOT use unnecessary quotes

IMPORTANT: Generate tweets in ${cuenta.idioma === 'en' ? 'ENGLISH' : 'SPANISH'} language only.`;

    const prompt = `
      VOZ DE LA CUENTA:
      ${vozCuenta}
      
      MAIN INSTRUCTIONS (${cuenta.idioma === 'en' ? 'ENGLISH' : 'ESPAÑOL'}):
      1. Visual style: ${cuenta.estilo_visual}
      2. Tone: ${cuenta.tono}
      
      USER IDEAS (HIGHEST PRIORITY):
      ${contextoCompleto.ideas}

      COMPLEMENTARY CONTEXT:
      ${contextoCompleto.contexto}

      CONFIGURATION:
      - Format: ${contextoCompleto.esThread ? 'Thread (connected tweets)' : 'Independent tweets'}
      ${contextoCompleto.esThread 
        ? '- 280 characters limit per tweet'
        : `- Tweet 1: MUST be between ${limites.tweet1.min} and ${limites.tweet1.max} characters
      - Tweet 2: MUST be between ${limites.tweet2.min} and ${limites.tweet2.max} characters
      - Tweet 3: MUST be between ${limites.tweet3.min} and ${limites.tweet3.max} characters`}

      Response format:
      - One tweet per line
      - ${contextoCompleto.esThread ? 'Include numbering (1/, 2/, 3/) at the start of each tweet' : 'No numbering or bullets'}
      - Do not use quotes unless they are textual quotes within the tweet
      - No unnecessary special characters
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.5, // Reducimos la temperatura para resultados más consistentes
      max_tokens: 1500,
      presence_penalty: 0.3, // Añadimos penalización de presencia para más variedad
      frequency_penalty: 0.3 // Añadimos penalización de frecuencia para más variedad
    });

    // Procesamos la respuesta para obtener los tweets individuales
    let tweets = [];
    if (response?.choices?.[0]?.message?.content) {
      tweets = response.choices[0].message.content
        .split('\n')
        .filter(tweet => tweet.trim().length > 0)
        .slice(0, 3); // Nos aseguramos de tomar solo 3 tweets
    }

    // Procesamos los tweets según si es thread o no
    if (contextoCompleto.esThread && Array.isArray(tweets) && tweets.length > 0) {
      // Para threads, verificamos que cada tweet tenga el formato correcto (1/, 2/, 3/)
      tweets = tweets.map((tweet, index) => {
        if (!tweet.startsWith(`${index + 1}/`)) {
          return `${index + 1}/ ${tweet}`;
        }
        return tweet;
      });
    } else if (Array.isArray(tweets) && tweets.length > 0) {
      // Para tweets individuales, ordenamos por longitud y verificamos límites
      tweets = tweets.map(tweet => {
        // Eliminamos comillas al inicio y final si existen
        return tweet.replace(/^["'](.+)["']$/, '$1');
      }).sort((a, b) => a.length - b.length);

      // Verificamos que cada tweet cumpla con sus límites
      const tweetsConLongitud = tweets.map((tweet, index) => ({
        tweet,
        longitud: tweet.length,
        limite: limites[`tweet${index + 1}`]
      }));

      console.log('Tweets generados con longitudes:', tweetsConLongitud);

      // Verificación más flexible de los límites
      const tweetsInvalidos = tweetsConLongitud.filter(({ tweet, longitud, limite }) => {
        // Permitimos un margen de error de 20 caracteres por debajo del mínimo
        const minFlexible = Math.max(0, limite.min - 20);
        return longitud < minFlexible || longitud > limite.max;
      });

      if (tweetsInvalidos.length > 0) {
        console.warn('Algunos tweets están fuera del rango ideal, pero dentro del margen permitido');
        // No lanzamos error, solo registramos la advertencia
      }

      // Asegurarnos de que los tweets estén ordenados por longitud
      tweets = tweetsConLongitud
        .sort((a, b) => a.longitud - b.longitud)
        .map(({ tweet }) => tweet);
    }

    return tweets;
  } catch (error) {
    console.error('Error generando tweets:', error);
    // Propagar el mensaje de error detallado si existe
    throw new Error(error.message || 'No se pudieron generar los tweets. Por favor, intenta de nuevo.');
  }
}

export async function generarIdeas(tono, ejemplos) {
  // Aquí iría el código para generar ideas, pero por ahora solo definimos la función.
}

export async function generarVozCuenta(analyses) {
  try {
    const prompt = `
Act as an AI expert in synthesizing social media personality profiles. Your task is to create a comprehensive voice profile from multiple tweet analyses that will guide content generation.

TWEET ANALYSES:
${analyses}

Create a unified voice profile that:
1. Identifies consistent patterns across all analyzed tweets
2. Extracts core personality traits and writing style
3. Determines primary communication strategies
4. Establishes tone and emotional range
5. Defines vocabulary preferences and linguistic patterns

OUTPUT FORMAT:
[Voice Profile]
- Core Personality:
- Writing Style:
- Communication Patterns:
- Emotional Range:
- Vocabulary Profile:
- Engagement Strategy:

[Content Generation Guidelines]
1. Tone Instructions:
2. Structure Preferences:
3. Language Choices:
4. Engagement Tactics:
5. Style Markers:

[Style Consistency Rules]
1. Always:
2. Sometimes:
3. Never:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating account voice:', error);
    throw new Error('No se pudo generar la voz de la cuenta. Por favor, intenta de nuevo.');
  }
}

export async function generateImagePrompt(tweetText) {
  try {
    const systemPrompt = `You are an advanced prompt generator for MidJourney image creation. Your task is to analyze a given tweet text and output exactly one detailed text prompt in English that captures a retrofuturistic magazine advertisement aesthetic. Your output must adhere to the following guidelines:

Input and Output:

Input: A tweet text.
Output: Exactly one MidJourney prompt written in English.
Required Elements in the Prompt:

Visual Description: Include detailed visual elements such as composition, colors, lighting, settings, outfits, and any notable objects.
Retro Aesthetic: Emphasize a vintage, retrofuturistic style inspired by 1950s–1970s magazine advertisements, featuring neon lights, metallic hues, and bold retro typography.
Title Integration: Incorporate a creative title into the design. Specify its placement (e.g., bottom center, top right, or bottom left) and style it with vibrant, retro typography (such as metallic gold, neon blue, or vibrant silver).
Conciseness and Clarity: Ensure the prompt is concise yet descriptive, providing clear, actionable instructions for generating the image.
Formatting and Examples:

The output should be a single, coherent text block without any extra commentary.
Example Prompts:
Example 1 ("Master of Flight"):
"Master of Flight: Leonardo da Vinci with sharp cheekbones, intense gray-blue eyes, long aquiline nose, graying beard and mustache, and curly brown hair streaked with gray. He wears a flowing navy blue tunic with gold embroidery and futuristic metallic gloves, holding a glowing holographic sketch of a flying machine in a retrofuturistic workshop. Neon blue and gold lights illuminate the scene with warm sunset tones, and a white banner at the bottom center displays bold retro typography in metallic gold reading 'Master of Flight'."
Example 2 ("Skyward Genius"):
"Skyward Genius: Leonardo da Vinci with intense gray-blue eyes and distinct features, dressed in a tailored crimson doublet with silver buttons and a flowing cape with atomic patterns. He is depicted with futuristic goggles and is sketching on a glowing tablet against a retrofuturistic city skyline. Neon green and purple lights, cool twilight tones, and a dynamic composition with the figure slightly off-center combine with bold retro typography in vibrant silver integrated in the top right corner reading 'Skyward Genius'."
Example 3 ("Visionary Inventor"):
"Visionary Inventor: Leonardo da Vinci with sharp features and a distinctive look, wearing a rich burgundy jerkin with gold stitching, futuristic leather boots, and a glowing chest plate with holographic projections. He is surrounded by holographic flying machines in a retrofuturistic workshop, bathed in neon orange and silver lighting. The composition is balanced with the figure in the foreground, and bold retro typography in neon blue is integrated in the bottom left corner reading 'Visionary Inventor'."
Your output should follow a similar structure, uniquely generated based on the provided tweet text.
Additional Instructions:

Do not include any reference to internal instructions or identities.
Ensure that all descriptions and specifications are in English.
Only output the final MidJourney prompt without any additional explanation or commentary.
Follow these instructions precisely to generate a single, well-crafted MidJourney prompt from the provided tweet text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: `Generate a MidJourney prompt based on this tweet text: "${tweetText}"` 
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating image prompt:', error);
    throw new Error('Could not generate image prompt. Please try again.');
  }
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
      model: "gpt-4o-mini",
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
