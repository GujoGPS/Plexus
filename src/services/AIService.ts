const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

const callGeminiAPI = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY não está configurada nas variáveis de ambiente.');
  }

  const requestBody: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erro na API do Gemini: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(`Erro do Gemini: ${data.error.message}`);
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('A resposta da API não contém texto gerado.');
    }

    return generatedText;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Falha ao chamar a API do Gemini. Verifique sua conexão com a internet.');
  }
};

export const aiService = {
  summarize: async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      throw new Error('O texto fornecido está vazio.');
    }

    const prompt = `Resuma o seguinte texto de forma clara e concisa, mantendo os pontos principais:\n\n${text}`;

    try {
      const summary = await callGeminiAPI(prompt);
      return summary;
    } catch (error) {
      console.error('Erro ao resumir texto:', error);
      throw error;
    }
  },

  improveWriting: async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) {
      throw new Error('O texto fornecido está vazio.');
    }

    const prompt = `Melhore a escrita do seguinte texto, corrigindo gramática, melhorando a clareza e mantendo o estilo original:\n\n${text}`;

    try {
      const improved = await callGeminiAPI(prompt);
      return improved;
    } catch (error) {
      console.error('Erro ao melhorar texto:', error);
      throw error;
    }
  },
};