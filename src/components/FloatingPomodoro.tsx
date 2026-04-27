import React, { useEffect, useState, useRef } from 'react';
import { Paper, Box, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import Draggable from 'react-draggable';
import ExpandIcon from '@mui/icons-material/FullscreenExit';
import CompressIcon from '@mui/icons-material/Compress';
import OpacityIcon from '@mui/icons-material/Opacity';

interface FloatingPomodoroProps {
  zIndex?: number;
}

const FloatingPomodoro: React.FC<FloatingPomodoroProps> = ({ zIndex = 1299 }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [tempDuration, setTempDuration] = useState(25);
  const [isCompact, setIsCompact] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsPaused(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handlePlay = () => {
    if (timeLeft === 0) {
      setTimeLeft(durationMinutes * 60);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(durationMinutes * 60);
  };

  const handleOpenSettings = () => {
    setTempDuration(durationMinutes);
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setDurationMinutes(tempDuration);
    setTimeLeft(tempDuration * 60);
    setSettingsOpen(false);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const handleToggleCompact = () => {
    setIsCompact(prev => !prev);
  };

  const handleToggleGhost = () => {
    setIsGhost(prev => !prev);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isFinished = timeLeft === 0;

  return (
    <>
      <Draggable bounds="parent" cancel=".no-drag">
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: isCompact ? 100 : 160,
            p: isCompact ? 1 : 1.5,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            zIndex,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            opacity: isGhost ? 0.4 : 1,
            transition: 'width 0.2s ease, opacity 0.2s ease, padding 0.2s ease',
            overflow: 'hidden',
          }}
        >
          {/* Header com controles */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isCompact ? 0.5 : 1 }}>
            {!isCompact && (
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
                POMODORO
              </Typography>
            )}
            {isCompact && (
              <Box sx={{ flexGrow: 1 }} />
            )}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              <Tooltip title={isCompact ? 'Expandir' : 'Compactar'}>
                <IconButton
                  size="small"
                  onClick={handleToggleCompact}
                  className="no-drag"
                  sx={{ p: 0.5 }}
                >
                  {isCompact ? <ExpandIcon sx={{ fontSize: '0.9rem' }} /> : <CompressIcon sx={{ fontSize: '0.9rem' }} />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isGhost ? 'Fantasma Off' : 'Fantasma On'}>
                <IconButton
                  size="small"
                  onClick={handleToggleGhost}
                  className="no-drag"
                  sx={{ p: 0.5, color: isGhost ? 'primary.main' : 'text.secondary' }}
                >
                  <OpacityIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
              {!isCompact && (
                <Tooltip title="Configurações">
                  <IconButton size="small" onClick={handleOpenSettings} className="no-drag" sx={{ p: 0.5 }}>
                    <SettingsIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontSize: isCompact ? '1.2rem' : '1.8rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              textAlign: 'center',
              color: isFinished ? 'error.main' : 'text.primary',
              mb: isCompact ? 0.5 : 1,
            }}
          >
            {timeDisplay}
          </Typography>

          {!isCompact && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              {!isRunning || isPaused ? (
                <Tooltip title="Iniciar">
                  <IconButton size="small" onClick={handlePlay} color="primary" disabled={isFinished && timeLeft === 0}>
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Pausar">
                  <IconButton size="small" onClick={handlePause} color="warning">
                    <PauseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Resetar">
                <IconButton size="small" onClick={handleReset} color="inherit">
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Paper>
      </Draggable>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleCloseSettings} maxWidth="xs" fullWidth>
        <DialogTitle>Configurações do Pomodoro</DialogTitle>
        <DialogContent>
          <TextField
            label="Duração (minutos)"
            type="number"
            fullWidth
            value={tempDuration}
            onChange={(e) => setTempDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
            inputProps={{ min: 1, max: 60 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>Cancelar</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FloatingPomodoro;
