import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../modules/auth/AuthService';

interface AuthState {
  isSignedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: () => void;
  logout: () => void;
}

// Função de inicialização estável com tratamento de erro robusto
const createInitialize = (set: (state: Partial<AuthState>) => void) => async () => {
  set({ isLoading: true, error: null });
  try {
    // Timeout para evitar loading infinito
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao inicializar autenticação')), 10000)
    );

    await Promise.race([
      authService.initialize(),
      timeoutPromise
    ]);

    if (authService.isSignedIn()) {
      set({
        isSignedIn: true,
        user: authService.getUser(),
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  } catch (error) {
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : 'Falha ao inicializar. Verifique sua conexão.',
    });
    console.error('Auth initialization error:', error);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false, // Inicialmente falso para evitar render baseado em estado não inicializado
  user: null,
  isLoading: true, // Começa em loading até a inicialização completar
  error: null,

  initialize: createInitialize(set),

  login: () => {
    authService.login();
  },

  logout: () => {
    authService.logout();
    set({ isSignedIn: false, user: null });
  },
}));

// Subscrever para atualizações de estado - apenas após inicialização
authService.subscribe((user) => {
  useAuthStore.setState({
    isSignedIn: !!user,
    user,
    isLoading: false, // Para de loading quando receber atualização do usuário
    error: null,
  });
  // Debug logging
  const state = useAuthStore.getState();
  console.table({
    isSignedIn: state.isSignedIn,
    isLoading: state.isLoading,
    userName: state.user?.name ?? 'null',
    userEmail: state.user?.email ?? 'null',
    error: state.error ?? 'null',
  });
});