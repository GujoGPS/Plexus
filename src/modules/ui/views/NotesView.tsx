import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Paper, Typography, CircularProgress, IconButton, Grid, Card, CardActionArea,
  TextField, Tooltip, Divider, Button, Snackbar, Alert, FormControl, InputAdornment, Dialog, 
  DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Slider, Popover, ToggleButtonGroup, 
  ToggleButton, Select, Switch, FormControlLabel
} from '@mui/material';

// ÍCONES
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import CreateIcon from '@mui/icons-material/Create';
import GestureIcon from '@mui/icons-material/Gesture';
import HighlightIcon from '@mui/icons-material/Highlight';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaletteIcon from '@mui/icons-material/Palette';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

// NOVOS ÍCONES PARA LISTAS E RECUO
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';

import { useNotesStore } from '../../../stores/notesStore';
import { useTasksStore } from '../../../stores/tasksStore';
import { useUiStore } from '../../../stores/uiStore';
import { aiService } from '../../../services/AIService';
import { Note } from '../../../types';

// ============================================================================
// CONSTANTES & DESIGN
// ============================================================================
const NOTEBOOK_COVERS = [
  { id: 'noite', gradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', name: 'Noite' },
  { id: 'algodao', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', name: 'Algodão Doce' },
  { id: 'menta', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', name: 'Menta' },
  { id: 'pessego', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', name: 'Pêssego' },
  { id: 'clean', gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', name: 'Minimalista' },
  { id: 'sol', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', name: 'Pôr do Sol' },
  { id: 'cafe', gradient: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)', name: 'Café' },
  { id: 'hacker', gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', name: 'Terminal' }
];

const PAGE_COLORS = [
  { id: 'white', hex: '#ffffff', name: 'Branco Puro' },
  { id: 'wheat', hex: '#F5DEB3', name: 'Trigo / Papiro' },
  { id: 'dark', hex: '#1e1e1e', name: 'Modo Escuro' },
  { id: 'sepia', hex: '#f4ecd8', name: 'Sépia' }
];

const PRESET_COLORS = ['#1e1e1e', '#ffffff', '#d50000', '#33b679', '#3f51b5', '#f6bf26', '#8e24aa', '#e67c73'];
const TEXT_COLOR_PRESETS = ['#1e1e1e', '#5f6368', '#d93025', '#1976d2', '#188038', '#f29900', '#a142f4', '#007b83'];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 30, 36, 48, 64, 72];
const FONTS = [
  { id: 'sans-serif', name: 'Normal (Sans)' },
  { id: 'serif', name: 'Elegante (Serif)' },
  { id: 'monospace', name: 'Código (Mono)' },
  { id: 'cursive', name: 'Manuscrita' },
  { id: 'Georgia', name: 'Jornal (Georgia)' },
  { id: '"Comic Sans MS", cursive', name: 'Divertida (Comic)' }
];

type ViewMode = 'text' | 'draw';
type DrawToolType = 'ballpen' | 'fountain' | 'highlighter' | 'eraser';

interface ToolConfig { size: number; opacity: number; color: string; }
interface TextPreset { id: string; name: string; font: string; size: number; color: string; }

const DEFAULT_GLOBAL_PRESETS: TextPreset[] = [
  { id: 'h1', name: 'Título Principal', font: 'sans-serif', size: 36, color: '#1e1e1e' },
  { id: 'h2', name: 'Subtítulo', font: 'serif', size: 24, color: '#3f51b5' },
  { id: 'body', name: 'Texto Normal', font: 'sans-serif', size: 16, color: '#1e1e1e' },
];

const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ============================================================================
// MOTOR GRÁFICO AVANÇADO (Draw + Rich Text)
// ============================================================================
interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onSave: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onBack, onSave, onDelete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);
  const richTextRef = useRef<HTMLDivElement>(null); 
  
  const { tasks, loadTasks } = useTasksStore();
  const navigateToItem = useUiStore((state) => state.navigateToItem);
  
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [activeDrawTool, setActiveDrawTool] = useState<DrawToolType>('ballpen');
  
  const [toolsConfig, setToolsConfig] = useState<Record<DrawToolType, ToolConfig>>({
    ballpen: { size: 3, opacity: 1, color: '#1e1e1e' },
    fountain: { size: 6, opacity: 1, color: '#3f51b5' },
    highlighter: { size: 24, opacity: 0.4, color: '#f6bf26' },
    eraser: { size: 40, opacity: 1, color: '#ffffff' }
  });
  
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontColor, setFontColor] = useState<string>('#1e1e1e');
  const [pageColor, setPageColor] = useState<string>(note.pageColor || '#ffffff');
  const [linkedTaskId, setLinkedTaskId] = useState(note.linkedTaskId || '');
  const [sPenEnabled, setSPenEnabled] = useState<boolean>(isMobileDevice); 
  
  const [title, setTitle] = useState(note.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const [globalPresets, setGlobalPresets] = useState<TextPreset[]>(() => {
    const saved = localStorage.getItem('notes_global_presets');
    return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_PRESETS;
  });
  const [localPresets, setLocalPresets] = useState<TextPreset[]>(note.localPresets ? JSON.parse(note.localPresets) : []);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', type: 'info' as any });
  const [toolAnchorEl, setToolAnchorEl] = useState<null | HTMLElement>(null);
  const [underlineAnchorEl, setUnderlineAnchorEl] = useState<null | HTMLElement>(null);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [presetScope, setPresetScope] = useState<'global' | 'local'>('global');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const hasDrawn = useRef(false);

  const handleCloseToast = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setToast(p => ({ ...p, open: false }));
  };

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    if (richTextRef.current && note.content && richTextRef.current.innerHTML !== note.content) {
      richTextRef.current.innerHTML = note.content;
    }
  }, [note.content]);

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const draftCanvas = draftCanvasRef.current;
    const container = containerRef.current;
    if (!mainCanvas || !draftCanvas || !container) return;

    const width = container.clientWidth || 1000;
    const height = Math.max(container.clientHeight, 1000);

    mainCanvas.width = width;
    mainCanvas.height = height;
    draftCanvas.width = width;
    draftCanvas.height = height;

    const mainCtx = mainCanvas.getContext('2d');
    if (!mainCtx) return;
    
    mainCtx.clearRect(0, 0, width, height);

    if (note.canvasData) {
      const img = new Image();
      img.onload = () => {
        mainCtx.drawImage(img, 0, 0);
        saveHistorySnapshot(mainCanvas);
      };
      img.src = note.canvasData;
    } else {
      saveHistorySnapshot(mainCanvas);
    }
  }, [note.id]);

  const saveHistorySnapshot = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/png');
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(dataUrl);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      loadSnapshot(history[historyStep - 1]);
      hasDrawn.current = true;
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(prev => prev + 1);
      loadSnapshot(history[historyStep + 1]);
      hasDrawn.current = true;
    }
  };

  const loadSnapshot = (dataUrl: string) => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  const clearCanvas = () => {
    const canvas = mainCanvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      saveHistorySnapshot(canvas);
      hasDrawn.current = true;
      setToolAnchorEl(null);
    }
  };

  const saveAndClose = () => {
    const canvas = mainCanvasRef.current;
    const canvasData = (canvas && hasDrawn.current) ? canvas.toDataURL('image/png') : note.canvasData;
    const textContent = richTextRef.current?.innerHTML || '';
    
    onSave(note.id, { 
      title, content: textContent, canvasData, linkedTaskId, 
      pageColor, localPresets: JSON.stringify(localPresets) 
    });
    onBack();
  };

  const confirmDeleteInside = () => {
    setSettingsDialogOpen(false);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    onDelete(note.id);
    setDeleteConfirmOpen(false);
    onBack();
  };

  // ==========================================================================
  // LÓGICA DO EDITOR RICH TEXT (Links, Código, Listas e Identação)
  // ==========================================================================
  const applyCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    richTextRef.current?.focus();
  };

  const applyCustomUnderline = (style: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    if (style === 'solid') { applyCommand('underline'); setUnderlineAnchorEl(null); return; }

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.textDecoration = `underline ${style} ${fontColor}`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    setUnderlineAnchorEl(null);
  };

  const handleRichTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // SUPORTE A IDENTAÇÃO VIA TAB
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        applyCommand('outdent');
      } else {
        applyCommand('indent');
      }
    }
  };

  const handleRichTextKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const node = selection.focusNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent || '';

    // LÓGICA DE AUTO-FORMATO (Enter ou Espaço)
    if (e.key === ' ' || e.key === 'Enter') {
      // Reconhecimento de Código (```)
      if (text.includes('```')) {
        const newHtml = richTextRef.current?.innerHTML.replace(/```/g, '') + 
          `<pre style="background-color:#1e1e1e; color:#56db3a; padding:12px; border-radius:8px; font-family:monospace; margin:10px 0;"><code>// Digite seu código aqui...</code></pre><br/>`;
        if (richTextRef.current) richTextRef.current.innerHTML = newHtml;
        const range = document.createRange();
        range.selectNodeContents(richTextRef.current as Node);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }

      // Reconhecimento Físico de Links
      const words = text.split(/\s+/);
      const lastWord = words[words.length - (e.key === ' ' ? 2 : 1)];
      if (lastWord && /^https?:\/\//i.test(lastWord)) {
        const range = document.createRange();
        const startPos = text.lastIndexOf(lastWord);
        range.setStart(node, startPos);
        range.setEnd(node, startPos + lastWord.length);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('createLink', false, lastWord);
        selection.collapseToEnd();
      }
    }

    // GATILHOS DE LISTA AO DIGITAR ESPAÇO
    if (e.key === ' ') {
      const offset = selection.focusOffset;
      const textToCursor = node.textContent?.slice(0, offset) || '';
      const trigger = textToCursor.trim();

      if (trigger === '*' || trigger === '-' || trigger === '1.') {
        // Apaga o gatilho (*, - ou 1.)
        for (let i = 0; i < textToCursor.length; i++) {
          document.execCommand('delete', false);
        }
        // Inicia a lista correspondente
        applyCommand(trigger === '1.' ? 'insertOrderedList' : 'insertUnorderedList');
      }
    }
  };

  // ==========================================================================
  // FÍSICA DO DESENHO (Canvas)
  // ==========================================================================
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (viewMode === 'text') return;
    if (sPenEnabled && e.pointerType !== 'pen') return; 

    isDrawing.current = true;
    const rect = mainCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastX.current = e.clientX - rect.left;
    lastY.current = e.clientY - rect.top;
    
    draftCanvasRef.current?.getContext('2d')?.clearRect(0, 0, draftCanvasRef.current.width, draftCanvasRef.current.height);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || viewMode === 'text') return;
    
    const rect = draftCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;

    let pressure = 0.5;
    if (sPenEnabled && e.pointerType === 'pen' && typeof e.pressure === 'number') {
      pressure = e.pressure > 0 ? e.pressure : 0.5;
    }

    const isEraserButton = e.pointerType === 'pen' && (e.buttons === 32 || e.buttons === 2);
    const currentTool = isEraserButton ? 'eraser' : activeDrawTool;
    const config = toolsConfig[currentTool];

    const ctx = currentTool === 'eraser' ? mainCanvasRef.current?.getContext('2d') : draftCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'fountain') {
      const angle = Math.PI / 4; 
      const w = config.size * pressure;
      const dx = Math.cos(angle) * w;
      const dy = Math.sin(angle) * w;
      
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.moveTo(lastX.current - dx, lastY.current - dy);
      ctx.lineTo(lastX.current + dx, lastY.current + dy);
      ctx.lineTo(currX + dx, currY + dy);
      ctx.lineTo(currX - dx, currY - dy);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(lastX.current, lastY.current);
      ctx.lineTo(currX, currY);
      
      ctx.strokeStyle = config.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentTool === 'ballpen') {
        ctx.lineWidth = config.size * (pressure * 1.5);
        ctx.globalCompositeOperation = 'source-over';
      } else if (currentTool === 'highlighter') {
        ctx.lineWidth = config.size;
        ctx.globalCompositeOperation = 'source-over';
      } else if (currentTool === 'eraser') {
        ctx.lineWidth = config.size + (pressure * 20);
        ctx.globalCompositeOperation = 'destination-out';
      }
      ctx.stroke();
    }

    lastX.current = currX;
    lastY.current = currY;
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (viewMode === 'draw' && activeDrawTool !== 'eraser') {
      const mainCtx = mainCanvasRef.current?.getContext('2d');
      const draftCanvas = draftCanvasRef.current;
      if (mainCtx && draftCanvas) {
        mainCtx.globalAlpha = toolsConfig[activeDrawTool].opacity;
        mainCtx.globalCompositeOperation = activeDrawTool === 'highlighter' ? 'multiply' : 'source-over';
        mainCtx.drawImage(draftCanvas, 0, 0);
        mainCtx.globalAlpha = 1.0;
        mainCtx.globalCompositeOperation = 'source-over';
        draftCanvas.getContext('2d')?.clearRect(0, 0, draftCanvas.width, draftCanvas.height);
      }
    }
    
    if (mainCanvasRef.current) saveHistorySnapshot(mainCanvasRef.current);
    hasDrawn.current = true;
  };

  // ==========================================================================
  // HANDLERS E MENUS
  // ==========================================================================
  const handleToolSelect = (e: React.MouseEvent<HTMLElement>, tool: DrawToolType) => {
    if (activeDrawTool === tool) { setToolAnchorEl(e.currentTarget); } 
    else { setActiveDrawTool(tool); }
  };

  const handleConfigChange = (key: keyof ToolConfig, value: any) => {
    setToolsConfig(prev => ({ ...prev, [activeDrawTool]: { ...prev[activeDrawTool], [key]: value } }));
  };

  const applyTextPreset = (presetId: string) => {
    const preset = [...globalPresets, ...localPresets].find(p => p.id === presetId);
    if (preset) {
      setFontFamily(preset.font);
      setFontSize(preset.size);
      setFontColor(preset.color);
      applyCommand('fontName', preset.font);
      applyCommand('foreColor', preset.color);
    }
  };

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: TextPreset = {
      id: Date.now().toString(), name: newPresetName.trim(), font: fontFamily, size: fontSize, color: fontColor
    };
    
    if (presetScope === 'global') {
      const updated = [...globalPresets, newPreset];
      setGlobalPresets(updated);
      localStorage.setItem('notes_global_presets', JSON.stringify(updated));
    } else {
      const updatedLocal = [...localPresets, newPreset];
      setLocalPresets(updatedLocal);
      onSave(note.id, { localPresets: JSON.stringify(updatedLocal) });
    }
    
    setPresetDialogOpen(false);
    setToast({ open: true, msg: `Preset salvo!`, type: 'success' });
  };

const handleAI = async () => {
    const txt = richTextRef.current?.innerText || ''; 
    if (!txt.trim()) { setToast({ open: true, msg: 'A nota está vazia!', type: 'warning' }); return; }
    
    setAiLoading(true);
    try {
      const summary = await aiService.summarize(txt);
      
      if (richTextRef.current) {
        // 1. Focamos no editor
        richTextRef.current.focus();

        // 2. Movemos o cursor do usuário para o final da nota
        const range = document.createRange();
        range.selectNodeContents(richTextRef.current);
        range.collapse(false); // false = vai para o final
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        // 3. Criamos a caixa do resumo usando blockquote (muito mais fácil de apagar que div)
        const aiHtml = `<br/><br/><blockquote style="background:#e3f2fd; padding:15px; border-radius:8px; border-left:4px solid #1976d2; margin: 0;"><strong>🤖 Resumo da IA:</strong><br/>${summary}</blockquote><br/>`;

        // 4. Injetamos o HTML do jeito certo. Isso permite usar Ctrl+Z para desfazer!
        document.execCommand('insertHTML', false, aiHtml);
      }
      setToast({ open: true, msg: 'IA analisou sua nota!', type: 'success' });
    } catch (err: any) {
      setToast({ open: true, msg: err.message || 'Erro ao conectar com a IA.', type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* TOOLBAR PRINCIPAL MESTRA */}
      <Paper sx={{ p: 1, mb: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tooltip title="Salvar e Voltar">
          <IconButton onClick={saveAndClose} color="primary" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        
        {isEditingTitle ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField variant="standard" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && (setTitle(tempTitle.trim()), setIsEditingTitle(false))} InputProps={{ sx: { fontSize: '1.3rem', fontWeight: 800 } }} sx={{ width: 180 }} />
            <IconButton onClick={() => { setTitle(tempTitle.trim()); setIsEditingTitle(false); }} color="success" size="small"><CheckCircleIcon /></IconButton>
          </Box>
        ) : (
          <Tooltip title="Clique para renomear">
            <Typography onClick={() => { setTempTitle(title); setIsEditingTitle(true); }} sx={{ fontSize: '1.3rem', fontWeight: 800, width: 215, cursor: 'pointer', '&:hover': { color: 'primary.main' } }} noWrap>
              {title || 'Sem Título'}
            </Typography>
          </Tooltip>
        )}
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 32 }} />
        
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
          <Tooltip title="Modo Digitação"><ToggleButton value="text" sx={{ px: 2 }}><TextFieldsIcon sx={{ mr: 1 }} fontSize="small" /> Texto</ToggleButton></Tooltip>
          <Tooltip title="Modo Desenho"><ToggleButton value="draw" sx={{ px: 2 }}><DrawIcon sx={{ mr: 1 }} fontSize="small" /> Desenho</ToggleButton></Tooltip>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 32 }} />

        {/* TOOLBAR ESPECÍFICA DE TEXTO (RICH TEXT + NOVAS FERRAMENTAS) */}
        {viewMode === 'text' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            <Tooltip title="Negrito"><IconButton onClick={() => applyCommand('bold')} size="small"><FormatBoldIcon /></IconButton></Tooltip>
            <Tooltip title="Itálico"><IconButton onClick={() => applyCommand('italic')} size="small"><FormatItalicIcon /></IconButton></Tooltip>
            
            {/* BOTÕES DE LISTA E IDENTAÇÃO */}
            <Tooltip title="Lista Marcadores"><IconButton onClick={() => applyCommand('insertUnorderedList')} size="small"><FormatListBulletedIcon /></IconButton></Tooltip>
            <Tooltip title="Lista Numerada"><IconButton onClick={() => applyCommand('insertOrderedList')} size="small"><FormatListNumberedIcon /></IconButton></Tooltip>
            <Tooltip title="Diminuir Recuo"><IconButton onClick={() => applyCommand('outdent')} size="small"><FormatIndentDecreaseIcon /></IconButton></Tooltip>
            <Tooltip title="Aumentar Recuo"><IconButton onClick={() => applyCommand('indent')} size="small"><FormatIndentIncreaseIcon /></IconButton></Tooltip>

            <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: 1 }}>
              <Tooltip title="Sublinhado"><IconButton onClick={() => applyCommand('underline')} size="small"><FormatUnderlinedIcon /></IconButton></Tooltip>
              <IconButton size="small" onClick={(e) => setUnderlineAnchorEl(e.currentTarget)}><ArrowDropDownIcon fontSize="small" /></IconButton>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />

            <Select size="small" value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); applyCommand('fontName', e.target.value); richTextRef.current?.focus(); }} sx={{ height: 36, minWidth: 130 }}>
              {FONTS.map(f => <MenuItem key={f.id} value={f.id} sx={{ fontFamily: f.id }}>{f.name}</MenuItem>)}
            </Select>
            
            <Select size="small" value={fontSize} onChange={(e) => { setFontSize(Number(e.target.value)); richTextRef.current?.focus(); }} sx={{ height: 36, minWidth: 70 }}>
              {FONT_SIZES.map(s => <MenuItem key={s} value={s}>{s}px</MenuItem>)}
            </Select>

            <Box sx={{ display: 'flex', gap: 0.5, px: 1, alignItems: 'center' }}>
              {TEXT_COLOR_PRESETS.map(c => (
                <Box
                  key={c}
                  onClick={() => { setFontColor(c); applyCommand('foreColor', c); }}
                  sx={{
                    width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                    border: fontColor === c ? '2px solid #1976d2' : '1px solid #ccc',
                    '&:hover': { transform: 'scale(1.1)' }, transition: 'all 0.2s'
                  }}
                />
              ))}
              <Tooltip title="Cor Personalizada">
                <input type="color" value={fontColor} onChange={(e) => { setFontColor(e.target.value); applyCommand('foreColor', e.target.value); richTextRef.current?.focus(); }} style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} />
              </Tooltip>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />
            
            <Select size="small" displayEmpty value="" onChange={(e) => applyTextPreset(e.target.value as string)} sx={{ height: 36, minWidth: 140 }}>
              <MenuItem value="" disabled><em>Meus Estilos...</em></MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'primary.main' }}>GERAIS</MenuItem>
              {globalPresets.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontFamily: p.font }}>{p.name}</MenuItem>)}
              {localPresets.length > 0 && <MenuItem disabled sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'secondary.main' }}>DESTA NOTA</MenuItem>}
              {localPresets.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontFamily: p.font }}>{p.name}</MenuItem>)}
            </Select>

            <Tooltip title="Salvar Estilo Atual">
              <IconButton onClick={() => setPresetDialogOpen(true)} color="primary"><BookmarkAddIcon /></IconButton>
            </Tooltip>
          </Box>
        )}

        {/* TOOLBAR ESPECÍFICA DE DESENHO */}
        {viewMode === 'draw' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex' }}>
              <IconButton disabled={historyStep <= 0} onClick={handleUndo}><UndoIcon /></IconButton>
              <IconButton disabled={historyStep >= history.length - 1} onClick={handleRedo}><RedoIcon /></IconButton>
            </Box>
            <ToggleButtonGroup value={activeDrawTool} exclusive size="small" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <Tooltip title="Caneta"><ToggleButton value="ballpen" onClick={(e) => handleToolSelect(e, 'ballpen')} sx={{ color: activeDrawTool === 'ballpen' ? toolsConfig.ballpen.color : 'text.secondary' }}><CreateIcon /></ToggleButton></Tooltip>
              <Tooltip title="Tinteiro"><ToggleButton value="fountain" onClick={(e) => handleToolSelect(e, 'fountain')} sx={{ color: activeDrawTool === 'fountain' ? toolsConfig.fountain.color : 'text.secondary' }}><GestureIcon /></ToggleButton></Tooltip>
              <Tooltip title="Marca Texto"><ToggleButton value="highlighter" onClick={(e) => handleToolSelect(e, 'highlighter')} sx={{ color: activeDrawTool === 'highlighter' ? toolsConfig.highlighter.color : 'text.secondary' }}><HighlightIcon /></ToggleButton></Tooltip>
              <Tooltip title="Borracha"><ToggleButton value="eraser" onClick={(e) => handleToolSelect(e, 'eraser')} sx={{ color: activeDrawTool === 'eraser' ? 'error.main' : 'text.secondary' }}><FormatClearIcon /></ToggleButton></Tooltip>
            </ToggleButtonGroup>
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />
        
        {/* ENGRENAGEM DE CONFIGURAÇÕES GERAIS */}
        <Tooltip title="Configurações da Nota">
          <IconButton onClick={() => setSettingsDialogOpen(true)} sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      <Menu anchorEl={underlineAnchorEl} open={Boolean(underlineAnchorEl)} onClose={() => setUnderlineAnchorEl(null)}>
        <MenuItem onClick={() => applyCustomUnderline('solid')}><Typography sx={{ textDecoration: 'underline solid' }}>Sólido</Typography></MenuItem>
        <MenuItem onClick={() => applyCustomUnderline('dashed')}><Typography sx={{ textDecoration: 'underline dashed' }}>Tracejado</Typography></MenuItem>
        <MenuItem onClick={() => applyCustomUnderline('dotted')}><Typography sx={{ textDecoration: 'underline dotted' }}>Pontilhado</Typography></MenuItem>
        <MenuItem onClick={() => applyCustomUnderline('wavy')}><Typography sx={{ textDecoration: 'underline wavy' }}>Ondulado</Typography></MenuItem>
      </Menu>

      <Popover open={Boolean(toolAnchorEl)} anchorEl={toolAnchorEl} onClose={() => setToolAnchorEl(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Box sx={{ p: 2, width: 250, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeDrawTool === 'eraser' && (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearCanvas} fullWidth>
              Limpar Tela Inteira
            </Button>
          )}
          
          <Typography variant="caption" fontWeight={700} color="text.secondary">TAMANHO: {toolsConfig[activeDrawTool]?.size}px</Typography>
          <Slider value={toolsConfig[activeDrawTool]?.size || 5} min={1} max={activeDrawTool === 'highlighter' ? 100 : 40} onChange={(_, v) => handleConfigChange('size', v)} />
          
          {activeDrawTool !== 'eraser' && (
            <>
              <Typography variant="caption" fontWeight={700} color="text.secondary">OPACIDADE</Typography>
              <Slider value={toolsConfig[activeDrawTool]?.opacity || 1} min={0.1} max={1} step={0.1} onChange={(_, v) => handleConfigChange('opacity', v)} />
              
              <Typography variant="caption" fontWeight={700} color="text.secondary">COR DA TINTA</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <Box key={c} onClick={() => handleConfigChange('color', c)} sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: toolsConfig[activeDrawTool]?.color === c ? '2px solid #1976d2' : '2px solid transparent' }} />
                ))}
                <input type="color" value={toolsConfig[activeDrawTool]?.color || '#000000'} onChange={(e) => handleConfigChange('color', e.target.value)} style={{ width: 26, height: 26, border: 'none', cursor: 'pointer', padding: 0, background: 'transparent' }} />
              </Box>
            </>
          )}
        </Box>
      </Popover>

      <Box ref={containerRef} sx={{ position: 'relative', flexGrow: 1, borderRadius: 3, overflowY: 'auto', bgcolor: pageColor, boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.08)', transition: 'background-color 0.3s' }}>
        <canvas ref={mainCanvasRef} style={{ display: 'block', width: '100%', minHeight: '100%', zIndex: 1 }} />
        <canvas
          ref={draftCanvasRef}
          onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerOut={stopDrawing} onContextMenu={(e) => e.preventDefault()}
          style={{ position: 'absolute', top: 0, left: 0, display: 'block', width: '100%', height: '100%', zIndex: 2, cursor: viewMode === 'text' ? 'text' : 'crosshair', touchAction: 'none', pointerEvents: viewMode === 'draw' ? 'auto' : 'none' }}
        />
        <Box
          ref={richTextRef}
          contentEditable={viewMode === 'text'}
          suppressContentEditableWarning={true}
          onKeyDown={handleRichTextKeyDown}
          onKeyUp={handleRichTextKeyUp}
          style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100%', background: 'transparent', 
            border: 'none', outline: 'none', padding: '32px', fontSize: `${fontSize}px`, fontFamily: fontFamily, 
            color: fontColor, pointerEvents: viewMode === 'text' ? 'auto' : 'none', zIndex: 3, lineHeight: '1.6'
          }}
        />
      </Box>

      {/* DIALOG DE CRIAR PRESET DE TEXTO */}
      <Dialog open={presetDialogOpen} onClose={() => setPresetDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>Salvar Estilo Atual</DialogTitle>
        <DialogContent dividers>
          <TextField label="Nome do Preset" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} fullWidth autoFocus sx={{ mb: 3, mt: 1 }} />
          <FormControl fullWidth>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1 }}>ONDE SALVAR?</Typography>
            <Select value={presetScope} onChange={(e) => setPresetScope(e.target.value as 'global' | 'local')} size="small">
              <MenuItem value="global">Para Todas as Notas (Global)</MenuItem>
              <MenuItem value="local">Apenas Nesta Nota (Local)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPresetDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={savePreset} variant="contained" disabled={!newPresetName.trim()}>Salvar Preset</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DE CONFIGURAÇÕES GERAIS DA NOTA */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><SettingsIcon color="primary" /> Opções da Nota</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>COR DA PÁGINA (FUNDO)</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {PAGE_COLORS.map(c => (
                  <Tooltip title={c.name} key={c.id}>
                    <Box onClick={() => setPageColor(c.hex)} sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: c.hex, cursor: 'pointer', border: pageColor === c.hex ? '3px solid #1976d2' : '1px solid #ccc', boxShadow: pageColor === c.hex ? '0 4px 10px rgba(25, 118, 210, 0.4)' : 0 }} />
                  </Tooltip>
                ))}
              </Box>
            </Box>

            <FormControl size="small" fullWidth>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>VINCULAR AO TO-DO</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Select fullWidth displayEmpty value={linkedTaskId || ''} onChange={(e) => setLinkedTaskId(e.target.value as string)} startAdornment={<InputAdornment position="start"><CheckCircleIcon fontSize="small" color="primary" /></InputAdornment>}>
                  <MenuItem value=""><em>Nenhuma tarefa vinculada</em></MenuItem>
                  {(tasks || []).filter(t => !t.completed).map(t => (<MenuItem key={t.id} value={t.id}>{t.title.substring(0, 40)}</MenuItem>))}
                </Select>
                {linkedTaskId && (
                  <Button variant="contained" color="primary" onClick={() => { saveAndClose(); navigateToItem('todo', linkedTaskId); }}>
                    Abrir Tarefa
                  </Button>
                )}
              </Box>
            </FormControl>

            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Modo S-Pen Strict</Typography>
                <Typography variant="caption" color="text.secondary">Ignora toques de dedos no modo de desenho</Typography>
              </Box>
              <FormControlLabel control={<Switch checked={sPenEnabled} onChange={(e) => setSPenEnabled(e.target.checked)} color="primary" />} label="" sx={{ m: 0 }} />
            </Box>

            <Button onClick={() => { setSettingsDialogOpen(false); handleAI(); }} disabled={aiLoading} startIcon={aiLoading ? <CircularProgress size={20} /> : <AutoFixHighIcon />} color="secondary" variant="contained" disableElevation sx={{ textTransform: 'none', py: 1.5, fontWeight: 700 }}>
              {aiLoading ? 'Resumindo...' : 'Resumir Conteúdo com IA'}
            </Button>
            
            <Button onClick={confirmDeleteInside} color="error" variant="outlined" startIcon={<DeleteIcon />} sx={{ mt: 1 }}>
              Excluir Nota Definitivamente
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSettingsDialogOpen(false)} variant="contained" disableElevation>Concluído</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon /> Excluir Nota</DialogTitle>
        <DialogContent><Typography>Tem certeza que deseja jogar "{title || 'Sem título'}" na lixeira? Isso não pode ser desfeito.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={executeDelete} color="error" variant="contained" disableElevation>Excluir</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast}><Alert severity={toast.type} variant="filled" sx={{ width: '100%', boxShadow: 3 }}>{toast.msg}</Alert></Snackbar>
    </Box>
  );
};

// ============================================================================
// VIEW PRINCIPAL: A BIBLIOTECA DE CADERNOS
// ============================================================================
const NotesView: React.FC = () => {
  const { notes, isLoading, loadNotes, addNote, updateNote, deleteNote } = useNotesStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { activeEntityId, clearActiveEntity } = useUiStore();
  
  useEffect(() => { loadNotes(); }, [loadNotes]);

  useEffect(() => {
    if (activeEntityId && !isLoading) {
      const noteToOpen = notes.find(n => n.id === activeEntityId);
      if (noteToOpen) {
        setSelectedNote(noteToOpen);
        clearActiveEntity();
      }
    }
  }, [activeEntityId, notes, isLoading, clearActiveEntity]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCover, setNewCover] = useState(NOTEBOOK_COVERS[0].gradient);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);

  const [changeCoverDialogOpen, setChangeCoverDialogOpen] = useState(false);
  const [editCoverValue, setEditCoverValue] = useState(NOTEBOOK_COVERS[0].gradient);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [toast, setToast] = useState({ open: false, msg: '', type: 'info' as any });
  const handleCloseToast = (_e?: React.SyntheticEvent | Event, reason?: string) => { if (reason === 'clickaway') return; setToast(p => ({ ...p, open: false })); };

  const openCreateDialog = () => { setNewTitle(''); setNewCover(NOTEBOOK_COVERS[0].gradient); setCreateDialogOpen(true); };

  const handleConfirmCreate = async () => {
    const finalTitle = newTitle.trim() || 'Novo Caderno';
    setCreateDialogOpen(false); 
    const newNote = await addNote({ title: finalTitle, content: '', canvasData: '', coverStyle: newCover });
    if (newNote) setSelectedNote(newNote as any);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, noteId: string) => { 
    e.stopPropagation(); e.preventDefault();
    setMenuAnchorEl(e.currentTarget); setMenuTargetId(noteId); 
  };
  const handleCloseMenu = () => { setMenuAnchorEl(null); };

  const handleMenuDelete = (e: React.MouseEvent) => { 
    e.stopPropagation(); handleCloseMenu(); setDeleteConfirmOpen(true);
  };
  
  const handleMenuChangeCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseMenu();
    const targetNote = notes.find(n => n.id === menuTargetId);
    if (targetNote) { setEditCoverValue(targetNote.coverStyle || NOTEBOOK_COVERS[0].gradient); setChangeCoverDialogOpen(true); }
  };

  const handleMenuRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseMenu();
    const targetNote = notes.find(n => n.id === menuTargetId);
    if (targetNote) { setEditTitleValue(targetNote.title); setRenameDialogOpen(true); }
  };

  const executeDeleteOutside = async () => {
    setDeleteConfirmOpen(false);
    if (menuTargetId) {
      await deleteNote(menuTargetId);
      setToast({ open: true, msg: 'Caderno excluído.', type: 'success' });
    }
  };

  const handleSaveChangedCover = async () => {
    setChangeCoverDialogOpen(false);
    if (menuTargetId) {
      await updateNote(menuTargetId, { coverStyle: editCoverValue });
      setToast({ open: true, msg: 'Capa atualizada.', type: 'success' });
    }
  };

  const handleSaveRename = async () => {
    setRenameDialogOpen(false);
    if (menuTargetId) {
      await updateNote(menuTargetId, { title: editTitleValue.trim() || 'Sem Título' });
      setToast({ open: true, msg: 'Caderno renomeado.', type: 'success' });
    }
  };

  if (isLoading && notes.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  if (selectedNote) {
    const currentData = notes.find(n => n.id === selectedNote.id) || selectedNote;
    return <NoteEditor note={currentData} onBack={() => setSelectedNote(null)} onSave={updateNote} onDelete={deleteNote} />;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">Sua Biblioteca</Typography>
          <Typography variant="body1" color="text.secondary">Cadernos, Ideias e Desenhos</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ borderRadius: 3, px: 3, py: 1.5, fontSize: '1rem', boxShadow: '0 4px 14px rgba(26, 115, 232, 0.4)' }}>
          Criar Caderno
        </Button>
      </Box>

      <Grid container spacing={4}>
        {notes.map((note) => (
          <Grid item xs={6} sm={4} md={3} lg={2.4} key={note.id}>
            <Card elevation={0} sx={{ bgcolor: 'transparent', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-6px)' } }}>
              <CardActionArea onClick={() => setSelectedNote(note)} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    height: 240, background: note.coverStyle || NOTEBOOK_COVERS[0].gradient, 
                    boxShadow: 'inset -8px 0px 12px rgba(0,0,0,0.1), inset 4px 0px 8px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.1)',
                    position: 'relative', display: 'flex', flexDirection: 'column', 
                    borderRadius: '8px 16px 16px 8px', borderLeft: '6px solid rgba(0,0,0,0.4)'
                  }}
                >
                  <IconButton onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleOpenMenu(e, note.id)} size="small" sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.9)', bgcolor: 'rgba(0,0,0,0.25)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <Paper elevation={4} sx={{ m: 'auto', p: 2, width: '75%', textAlign: 'center', bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#2c3e50', lineHeight: 1.3 }}>{note.title || 'Sem título'}</Typography>
                  </Paper>
                </Box>
              </CardActionArea>
              <Box sx={{ pt: 1.5, px: 0.5, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Atualizado em {new Date(note.updatedAt).toLocaleDateString('pt-BR')}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu} PaperProps={{ sx: { borderRadius: 2, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}>
        <MenuItem onClick={handleMenuRename}><EditIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Renomear</MenuItem>
        <MenuItem onClick={handleMenuChangeCover}><PaletteIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} /> Mudar Capa</MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuDelete}><DeleteIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} /> Excluir</MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Novo Caderno</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 1 }}>
            <TextField label="Título do Caderno" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} fullWidth autoFocus placeholder="Ex: Reuniões Técnicas..." InputProps={{ sx: { fontSize: '1.2rem', fontWeight: 600 } }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>ESCOLHA O ESTILO DA CAPA</Typography>
              <Grid container spacing={2}>
                {NOTEBOOK_COVERS.map((cover) => (
                  <Grid item xs={3} key={cover.id}>
                    <Tooltip title={cover.name} placement="top">
                      <Box onClick={() => setNewCover(cover.gradient)} sx={{ height: 90, background: cover.gradient, borderRadius: '4px 10px 10px 4px', cursor: 'pointer', boxShadow: newCover === cover.gradient ? '0 0 0 3px #1976d2, 0 8px 16px rgba(0,0,0,0.2)' : 'inset -4px 0px 6px rgba(0,0,0,0.1)', borderLeft: '4px solid rgba(0,0,0,0.3)', transform: newCover === cover.gradient ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleConfirmCreate} variant="contained" disableElevation sx={{ fontWeight: 600, px: 3 }}>Criar Caderno</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Renomear Caderno</DialogTitle>
        <DialogContent dividers>
          <TextField label="Novo Título" value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)} fullWidth autoFocus sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setRenameDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSaveRename} variant="contained" disableElevation sx={{ fontWeight: 600, px: 3 }}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={changeCoverDialogOpen} onClose={() => setChangeCoverDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Mudar Estilo</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {NOTEBOOK_COVERS.map((cover) => (
              <Grid item xs={3} key={cover.id}>
                <Box onClick={() => setEditCoverValue(cover.gradient)} sx={{ height: 90, background: cover.gradient, borderRadius: '4px 10px 10px 4px', cursor: 'pointer', boxShadow: editCoverValue === cover.gradient ? '0 0 0 3px #1976d2, 0 8px 16px rgba(0,0,0,0.2)' : 'inset -4px 0px 6px rgba(0,0,0,0.1)', borderLeft: '4px solid rgba(0,0,0,0.3)', transform: editCoverValue === cover.gradient ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setChangeCoverDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleSaveChangedCover} variant="contained" disableElevation sx={{ fontWeight: 600, px: 3 }}>Salvar Nova Capa</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon /> Excluir Caderno</DialogTitle>
        <DialogContent><Typography>Tem certeza que deseja jogar este caderno na lixeira? Isso não pode ser desfeito.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={executeDeleteOutside} color="error" variant="contained" disableElevation>Excluir Definitivamente</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast}><Alert severity={toast.type} variant="filled" sx={{ width: '100%', boxShadow: 3 }}>{toast.msg}</Alert></Snackbar>
    </Box>
  );
};

export default NotesView;