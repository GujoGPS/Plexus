import React, { useEffect, useState, useCallback } from 'react';
import { Settings as SettingsIcon, VpnKey } from '@mui/icons-material';
import { useSettingsStore } from './stores/settingsStore';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Drawer,
  Fab,
} from '@mui/material';
import {
  CalendarMonth,
  Note,
  CheckCircle,
  Logout,
  DarkMode,
  LightMode,
  Menu,
  Close,
} from '@mui/icons-material';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useUiStore } from './stores/uiStore';
import TaskView from './modules/ui/views/TaskView';
import NotesView from './modules/ui/views/NotesView';
import CalendarView from './modules/ui/views/CalendarView';
import FloatingPomodoro from './components/FloatingPomodoro';

// ============================================================================
// TYPES
// ============================================================================
type ViewType = 'calendario' | 'notas' | 'todo';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const NAV_ITEMS: NavItem[] = [
  { id: 'calendario', label: 'Calendário', icon: <CalendarMonth /> },
  { id: 'notas', label: 'Notas', icon: <Note /> },
  { id: 'todo', label: 'To-Do', icon: <CheckCircle /> },
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DRAWER_WIDTH = 280;

// ============================================================================
// AUTH STORE SELECTORS (Reactive)
// ============================================================================
const useAuthSelectors = () => {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const error = useAuthStore((state) => state.error);
  const initialize = useAuthStore((state) => state.initialize);

  return { isSignedIn, isLoading, user, error, initialize };
};

// ============================================================================
// DEBUG LOGGER
// ============================================================================
const logAuthState = () => {
  const state = useAuthStore.getState();
  console.table({
    isSignedIn: state.isSignedIn,
    isLoading: state.isLoading,
    user: state.user?.name ?? 'null',
    email: state.user?.email ?? 'null',
    error: state.error ?? 'null',
  });
};

// ============================================================================
// VIEW SWITCHER COMPONENT
// ============================================================================
const ViewSwitcher: React.FC<{ activeView: ViewType }> = ({ activeView }) => {
  const renderContent = () => {
    switch (activeView) {
      case 'calendario':
        return <CalendarView />;
      case 'notas':
        return <NotesView />;
      case 'todo':
        return <TaskView />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: 'background.default',
        p: { xs: 2, md: 3 },
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      {renderContent()}
    </Box>
  );
};

// ============================================================================
// MOBILE SIDEBAR CONTENT (usado dentro do Drawer)
// ============================================================================
const MobileSidebarContent: React.FC<{
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onClose: () => void;
}> = ({ activeView, onViewChange, onClose }) => {
  const user = useAuthStore((state) => state.user);

  const handleNavClick = (view: ViewType) => {
    onViewChange(view);
    onClose();
  };

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo Area */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" fontWeight="800" color="primary.main">
          Plexus
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Olá, {user?.name || 'Usuário'}
        </Typography>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation */}
      <List sx={{ pt: 2, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              sx={{
                mx: 1.5,
                borderRadius: 2,
                mb: 0.5,
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: isActive ? 'primary.dark' : 'action.hover',
                },
                '& .MuiListItemIcon-root': {
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* User Profile at bottom */}
      <Divider sx={{ mx: 2 }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={user?.picture}
          alt={user?.name || 'User'}
          sx={{ width: 36, height: 36 }}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={500}
            noWrap
            sx={{ maxWidth: '100%' }}
          >
            {user?.name || 'Usuário'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ maxWidth: '100%' }}
          >
            {user?.email || ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// RESPONSIVE SIDEBAR (Drawer)
// ============================================================================
const ResponsiveSidebar: React.FC<{
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}> = ({ activeView, onViewChange, mobileOpen, onMobileClose }) => {
  const drawerContent = (
    <MobileSidebarContent
      activeView={activeView}
      onViewChange={onViewChange}
      onClose={onMobileClose}
    />
  );

  return (
    <>
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

// ============================================================================
// TOP HEADER
// ============================================================================
const TopHeader: React.FC<{
  activeView: ViewType;
  onLogout: () => void;
  onMenuClick: () => void;
}> = ({ activeView, onLogout, onMenuClick }) => {
  const user = useAuthStore((state) => state.user);
  const currentNavItem = NAV_ITEMS.find((item) => item.id === activeView);
  const { mode, toggleTheme } = useThemeStore();

  // Estados para o Modal de BYOK
  const [settingsOpen, setSettingsOpen] = useState(false);
  const geminiApiKey = useSettingsStore((state) => state.geminiApiKey);
  const setGeminiApiKey = useSettingsStore((state) => state.setGeminiApiKey);
  const [tempKey, setTempKey] = useState(geminiApiKey || '');

  const handleOpenSettings = () => {
    setTempKey(geminiApiKey || '');
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setGeminiApiKey(tempKey.trim() || null);
    setSettingsOpen(false);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <IconButton onClick={onMenuClick} color="inherit" sx={{ display: { xs: 'block', md: 'none' }, mr: 2, color: 'text.secondary' }}>
            <Menu />
          </IconButton>

          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
            {currentNavItem?.label || 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            
            {/* NOVO: Botão de Configurações */}
            <Tooltip title="Configurações (BYOK)">
              <IconButton onClick={handleOpenSettings} color="inherit" size="small" sx={{ color: 'text.primary' }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={mode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>
              <IconButton onClick={toggleTheme} color="inherit" size="small" sx={{ color: 'text.primary' }}>
                {mode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Tooltip>

            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={500} color="text.primary">{user?.name || 'Usuário'}</Typography>
              <Typography variant="caption" color="text.primary" sx={{ opacity: 0.7 }}>{user?.email || ''}</Typography>
            </Box>

            <Tooltip title="Sair">
              <IconButton onClick={onLogout} color="error" size="small">
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Modal de Configurações do Sistema */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
          <SettingsIcon color="primary" /> Configurações do Plexus
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="subtitle2" color="primary" fontWeight={700}>
              Inteligência Artificial (BYOK)
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Utilizamos o Google Gemini para gerar resumos em suas notas. Insira sua própria chave de API (Bring Your Own Key) para obter privacidade total e contornar os limites do sistema. A chave é salva apenas no seu navegador.
            </Typography>
            <TextField
              label="Google Gemini API Key"
              variant="outlined"
              fullWidth
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
              InputProps={{
                startAdornment: <VpnKey color="action" sx={{ mr: 1.5, fontSize: 20 }} />,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSettingsOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveSettings} variant="contained" disableElevation>Salvar Chave</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ============================================================================
// PLEXUS LANDING PAGE (SAAS PREMIUM DESIGN)
// ============================================================================
const LandingPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#001a17', // Fundo super escuro de fallback
    }}
  >
    {/* Imagem de Fundo Premium (Unsplash - Foco/Medicina/Estudo) com Overlay */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        // Imagem de uma biblioteca moderna / ambiente de foco profundo
        backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          // Overlay gradiente usando a sua cor #00473F
          background: 'linear-gradient(135deg, rgba(0, 71, 63, 0.96) 0%, rgba(0, 25, 22, 0.85) 100%)',
        }
      }}
    />

    {/* Conteúdo Principal */}
    <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 6, md: 10 },
        }}
      >
        {/* Coluna da Esquerda: Copywriting de Alta Conversão */}
        <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Box
            sx={{
              display: 'inline-block',
              px: 2,
              py: 0.5,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              mb: 3
            }}
          >
            <Typography variant="caption" sx={{ color: '#4ADE80', fontWeight: 700, letterSpacing: 1.5 }}>
              SISTEMA DE ALTA PERFORMANCE
            </Typography>
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            sx={{ 
              color: '#ffffff', 
              mb: 2, 
              fontSize: { xs: '2.5rem', md: '4rem' },
              lineHeight: 1.1,
              letterSpacing: '-1px'
            }}
          >
            Domine sua <br />
            <Box component="span" sx={{ color: '#4ADE80' }}>Carga Cognitiva.</Box>
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 5, fontWeight: 400, lineHeight: 1.6, maxWidth: 500 }}
          >
            O <strong>Plexus</strong> é o ecossistema invisível que sincroniza seu calendário, blinda sua concentração com um ambiente de Foco Profundo e organiza seus estudos médicos em um palácio de memória seguro no Google Drive da sua conta!
          </Typography>

          {/* Features Rápidas em Linha */}
          <Box sx={{ display: 'flex', gap: 3, mb: 5, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
            {['Foco Profundo', 'Pomodoro Tracker', 'IA Integrada', 'Zero Fricção'].map((feature) => (
              <Typography key={feature} variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#4ADE80' }} /> {feature}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Coluna da Direita: Card Glassmorphism de Login */}
        <Box sx={{ flex: { xs: 'none', md: '0 0 420px' }, width: '100%' }}>
          <Card
            sx={{
              p: 5,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Brilho interno do card */}
            <Box sx={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
            
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 0 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#ffffff', letterSpacing: '-0.5px' }}>
                  Plexus
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 1 }}>
                  Acesse com sua conta Workspace
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={onLogin}
                fullWidth
                sx={{
                  py: 2,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  color: '#00473F',
                  boxShadow: '0 8px 24px rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: '#e6e6e6',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(255,255,255,0.2)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Continuar com Google
              </Button>

              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', lineHeight: 1.5 }}>
                  <strong>Privacidade Absoluta:</strong> Seus dados são salvos de forma criptografada no seu próprio Drive (AppData). Nós não temos acesso a nada.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  </Box>
);

// ============================================================================
// ERROR STATE
// ============================================================================
const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <Box
    sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: 4,
    }}
  >
    <Typography variant="h4" fontWeight="medium" color="error.main" gutterBottom>
      Plexus
    </Typography>
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" color="error.main" gutterBottom>
        Erro de inicialização
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        {error}
      </Typography>
      <Button
        variant="outlined"
        size="medium"
        onClick={onRetry}
        sx={{ mt: 3 }}
      >
        Tentar novamente
      </Button>
    </Box>
  </Box>
);

// ============================================================================
// NOT CONFIGURED STATE
// ============================================================================
const NotConfiguredState: React.FC = () => (
  <Box
    sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: 4,
    }}
  >
    <Typography variant="h4" fontWeight="medium" color="error.main" gutterBottom>
      Plexus
    </Typography>
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" color="error.main" gutterBottom>
        Configuração faltando
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Variável de ambiente <code>VITE_GOOGLE_CLIENT_ID</code> não encontrada.
        Por favor, configure seu arquivo .env.
      </Typography>
    </Box>
  </Box>
);

// ============================================================================
// LOADING STATE
// ============================================================================
const LoadingState: React.FC = () => (
  <Box
    sx={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Typography variant="h4" fontWeight="medium" gutterBottom>
      Plexus
    </Typography>
    <Box sx={{ mt: 3 }}>
      <CircularProgress size={48} />
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
      Inicializando...
    </Typography>
  </Box>
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
const App: React.FC = () => {
  const { isSignedIn, isLoading, error, initialize } = useAuthSelectors();
  const zenMode = useUiStore((state) => state.zenMode);
  const toggleZenMode = useUiStore((state) => state.toggleZenMode);
  
  // NAVEGAÇÃO GLOBAL CONECTADA AQUI
  const activeView = useUiStore((state) => state.activeView) as ViewType;
  const setActiveView = useUiStore((state) => state.setActiveView);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ==========================================================================
  // HYDRATION PROTECTION: Wait for client-side mount before rendering
  // ==========================================================================
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // ==========================================================================
  // INITIALIZE AUTH WITH PROPER PROMISE HANDLING
  // ==========================================================================
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initAuth = async () => {
      try {
        await initialize();
        logAuthState();
      } catch (err) {
        console.error('Auth init failed:', err);
      }
    };

    initAuth();
  }, [initialize]);

  // ==========================================================================
  // DEBUG: Log state changes
  // ==========================================================================
  useEffect(() => {
    logAuthState();
  }, [isSignedIn, isLoading, error]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const handleLogin = useCallback(() => {
    login();
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
    setActiveView('calendario' as any);
  }, [logout, setActiveView]);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view as any);
  }, [setActiveView]);

  const handleRetry = useCallback(() => {
    initialize();
  }, [initialize]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // ==========================================================================
  // RENDER: Hydration protection - don't render until mounted
  // ==========================================================================
  if (!isInitialized) {
    return <LoadingState />;
  }

  // ==========================================================================
  // RENDER: Not configured state
  // ==========================================================================
  if (!GOOGLE_CLIENT_ID) {
    return <NotConfiguredState />;
  }

  // ==========================================================================
  // RENDER: Loading state
  // ==========================================================================
  if (isLoading) {
    return <LoadingState />;
  }

  // ==========================================================================
  // RENDER: Error state
  // ==========================================================================
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // ==========================================================================
  // RENDER: Landing page (not signed in)
  // ==========================================================================
  if (!isSignedIn) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // ==========================================================================
  // RENDER: Dashboard (signed in)
  // ==========================================================================
  if (zenMode) {
    return (
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'background.default', zIndex: 1400 }}>
        <CssBaseline />
        {/* View Switcher Fullscreen */}
        <Box sx={{ width: '100vw', height: '100vh' }}>
          <ViewSwitcher activeView={activeView} />
        </Box>
        {/* Exit Zen Mode FAB */}
        <Fab
          color="primary"
          onClick={toggleZenMode}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
          }}
        >
          <Close />
        </Fab>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Responsive Sidebar */}
      <ResponsiveSidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileMenuClose}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { xs: 0, md: zenMode ? 0 : `${DRAWER_WIDTH}px` },
          width: '100%',
          transition: 'ml 0.3s ease',
        }}
      >
        {/* Top Header */}
        <TopHeader
          activeView={activeView}
          onLogout={handleLogout}
          onMenuClick={handleMobileMenuToggle}
        />

        {/* View Switcher */}
        <ViewSwitcher activeView={activeView} />
      </Box>

      {/* Floating Pomodoro Timer */}
      <FloatingPomodoro zIndex={1299} />
    </Box>
  );
};

export default App;