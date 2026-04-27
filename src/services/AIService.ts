import { useSettingsStore } from '../stores/settingsStore';

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
  // LÓGICA BYOK: Pega a chave do usuário primeiro, senão usa a do .env
  const userKey = useSettingsStore.getState().geminiApiKey;
  const apiKey = userKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Acesse as configurações (⚙️) no topo da tela para adicionar sua chave.');
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
      
      // Retorna uma mensagem amigável se a chave for inválida (Erro 400 ou 403)
      if (response.status === 400 || response.status === 403) {
         throw new Error('Chave de API inválida. Verifique suas configurações na engrenagem no topo da tela.');
      }
      
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
      // Repassa o erro para a interface mostrar o Toast vermelho bonitinho
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