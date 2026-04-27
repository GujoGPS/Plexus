# Plexus (WorkspaceHub) 🌌🧠

**Plexus** é um ecossistema de produtividade pessoal inteligente, desenvolvido especificamente como um "cérebro externo" para auxiliar pessoas neurodivergentes (TEA/TDAH) a gerenciarem sua carga cognitiva com eficiência, foco e zero fricção.

## 🚀 O que é o Plexus?

Diferente de ferramentas de produtividade genéricas, o Plexus foi construído para respeitar o funcionamento do cérebro neurodivergente. Ele integra o **Google Workspace** (Calendar, Drive, Notes e Tasks) em uma interface unificada, minimalista e altamente visual.

### ✨ Diferenciais para TEA/TDAH

* **Modo Zen (Hyperfocus):** Interface limpa que elimina distrações visuais para foco profundo em escrita ou planejamento.
* **Gestão de Energia (Baterias 🔋):** Classificação de tarefas pelo custo de energia mental (de 1 a 5), prevenindo o burnout.
* **Pomodoro Flutuante:** Um timer sempre visível, com modo fantasma, para ajudar a quebrar a inércia e iniciar tarefas sem causar ansiedade.
* **Sistema Espacial (Constelação):** Navegação visual intuitiva onde suas ideias flutuam, facilitando a organização espacial.
* **Acessibilidade:** Suporte total para escrita manual (S-Pen) e atalhos de organização que diminuem a paralisia de escolha.

## 🛠️ Arquitetura e Tecnologias

* **Frontend:** React 18 + TypeScript + Vite
* **UI/UX:** Material UI (MUI) v5
* **Gerenciamento de Estado:** Zustand
* **Cloud & Auth:** Google Identity Services + Google Calendar API
* **Persistência:** Google Drive API (Salvo de forma privada na `appDataFolder`)
* **Inteligência Artificial:** Gemini 3.0 Flash (para sumarização e refinamento de notas)

## 📦 Como Instalar e Rodar Localmente

### 1. Pré-requisitos
* Node.js instalado.
* Uma conta no **Google Cloud Console** com um Client ID OAuth 2.0 configurado.
* Uma chave de API do **Google AI Studio** (Gemini).

### 2. Instalação
Clone o repositório e instale as dependências:
\`\`\`bash
git clone https://github.com/seu-usuario/plexus.git
cd plexus
npm install
\`\`\`

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto contendo as suas chaves:
\`\`\`env
VITE_GOOGLE_CLIENT_ID=seu_client_id_do_google
VITE_GEMINI_API_KEY=sua_chave_da_api_gemini
\`\`\`
*(Nota: O arquivo `.env` está no `.gitignore` e nunca deve ser commitado).*

### 4. Rodando o App
\`\`\`bash
npm run dev
\`\`\`

## 🔒 Privacidade Absoluta

O Plexus foi desenhado para ser seguro por design. Seus dados (notas, tarefas, histórico) são salvos e criptografados exclusivamente na pasta oculta do seu próprio Google Drive. Nenhum servidor de terceiros armazena suas informações pessoais.

## 📄 Licença
Projeto criado para fins de acessibilidade cognitiva e uso pessoal.