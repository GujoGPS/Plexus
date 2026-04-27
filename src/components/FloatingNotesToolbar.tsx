import React, { useRef } from 'react';
import { Paper, Box, IconButton, Tooltip, Typography } from '@mui/material';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import SparkleIcon from '@mui/icons-material/AutoAwesome';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PushPinIcon from '@mui/icons-material/PushPin';

interface FloatingNotesToolbarProps {
  onSummarize: () => void;
  onImprove: () => void;
  aiLoading: boolean;
  disabled: boolean;
  zIndex?: number;
}

const FloatingNotesToolbar: React.FC<FloatingNotesToolbarProps> = ({
  onSummarize,
  onImprove,
  aiLoading,
  disabled,
  zIndex = 1300,
}) => {
  const draggableRef = useRef<{ offset: { x: number; y: number } } | null>(null);

  const handleResetPosition: DraggableEventHandler = (_e, handle) => {
    if (handle) {
      const event = handle as unknown as { target: HTMLElement };
      if (event?.target?.closest) {
        const btn = event.target.closest('[data-snap]');
        if (btn) {
          window.location.reload();
        }
      }
    }
  };

  const handleSnapToTop = () => {
    const draggableEl = document.querySelector('.FloatingNotesToolbar-draggable');
    if (draggableEl) {
      const parent = draggableEl.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const element = draggableEl.querySelector('.MuiPaper-root');
        if (element) {
          (element as HTMLElement).style.top = '80px';
          (element as HTMLElement).style.left = '50%';
          (element as HTMLElement).style.transform = 'translateX(-50%)';
        }
      }
    }
  };

  return (
    <Draggable
      bounds="parent"
      cancel=".no-drag"
      onStop={handleResetPosition}
      nodeRef={undefined}
    >
      <Paper
        className="FloatingNotesToolbar-draggable"
        elevation={4}
        sx={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          zIndex,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Tooltip title="Encaixar no topo">
          <IconButton
            size="small"
            onClick={handleSnapToTop}
            className="no-drag"
            data-snap="true"
            sx={{ color: 'text.secondary' }}
          >
            <PushPinIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Resetar posição">
          <IconButton
            size="small"
            onClick={() => window.location.reload()}
            className="no-drag"
            sx={{ color: 'text.secondary' }}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', mx: 0.5 }} />

        <Tooltip title="Resumir com IA">
          <IconButton
            size="small"
            onClick={onSummarize}
            disabled={aiLoading || disabled}
            sx={{ color: 'primary.main' }}
          >
            <SparkleIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Melhorar texto com IA">
          <IconButton
            size="small"
            onClick={onImprove}
            disabled={aiLoading || disabled}
            sx={{ color: 'primary.main' }}
          >
            <SparkleIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {aiLoading && (
          <Box sx={{ ml: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Processando...
            </Typography>
          </Box>
        )}
      </Paper>
    </Draggable>
  );
};

export default FloatingNotesToolbar;
