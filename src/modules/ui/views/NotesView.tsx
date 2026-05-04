import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Box, Paper, Typography, CircularProgress, IconButton, Grid, Card, CardActionArea,
  TextField, Tooltip, Divider, Button, Snackbar, Alert, FormControl, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Select
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaletteIcon from '@mui/icons-material/Palette';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { useNotesStore } from '../../../stores/notesStore';
import { useTasksStore } from '../../../stores/tasksStore';
import { useUiStore } from '../../../stores/uiStore';
import { aiService } from '../../../services/AIService';
import { Note } from '../../../types';

// ============================================================================
// REGISTRAR TAMANHOS PERSONALIZADOS EXATOS NO QUILL (SOTA)
// Permite mudar o tamanho palavra por palavra sem afetar a linha toda
// ============================================================================
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '64px', '72px'];
Quill.register(Size, true);

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

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onSave: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// MOTOR DE EDIÇÃO MODERNO (ReactQuill)
// ============================================================================
const NoteEditor: React.FC<NoteEditorProps> = ({ note, onBack, onSave, onDelete }) => {
  const { tasks, loadTasks } = useTasksStore();
  const navigateToItem = useUiStore((state) => state.navigateToItem);

  const [content, setContent] = useState(note.content || '');
  const [title, setTitle] = useState(note.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [pageColor, setPageColor] = useState<string>(note.pageColor || '#ffffff');
  const [linkedTaskId, setLinkedTaskId] = useState(note.linkedTaskId || '');

  const [aiLoading, setAiLoading] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: '', type: 'info' as any });

  const reactQuillRef = useRef<ReactQuill>(null);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleCloseToast = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setToast(p => ({ ...p, open: false }));
  };

  const saveAndClose = () => {
    onSave(note.id, {
      title,
      content,
      canvasData: '', // Limpando legado do canvas se houver
      linkedTaskId,
      pageColor
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

  const handleAI = async () => {
    const text = reactQuillRef.current?.getEditor().getText() || '';

    if (!text.trim()) {
      setToast({ open: true, msg: 'A nota está vazia!', type: 'warning' });
      return;
    }

    setAiLoading(true);
    try {
      const summary = await aiService.summarize(text);
      const aiHtml = `<br/><br/><blockquote style="background:#e3f2fd; padding:15px; border-radius:8px; border-left:4px solid #1976d2; margin: 0;"><strong>✨ Resumo da IA:</strong><br/>${summary}</blockquote><br/>`;

      const quill = reactQuillRef.current?.getEditor();
      if (quill) {
        const length = quill.getLength();
        quill.clipboard.dangerouslyPasteHTML(length, aiHtml);
      }
      setToast({ open: true, msg: 'IA analisou sua nota!', type: 'success' });
    } catch (err: any) {
      setToast({ open: true, msg: err.message || 'Erro ao conectar com a IA.', type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  // Configuração nativa e poderosa do Quill
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'size': Size.whitelist }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'] // Remover formatação
    ]
  }), []);

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
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* ENGRENAGEM DE CONFIGURAÇÕES GERAIS E IA */}
        <Tooltip title="Resumir com IA">
          <IconButton onClick={handleAI} disabled={aiLoading} sx={{ bgcolor: 'action.hover', color: 'secondary.main', mr: 1 }}>
            {aiLoading ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Configurações da Nota">
          <IconButton onClick={() => setSettingsDialogOpen(true)} sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* EDITOR RICH TEXT PROFISSIONAL */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: pageColor, 
        borderRadius: 3, 
        overflow: 'hidden', 
        boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.08)', 
        transition: 'background-color 0.3s',
        '& .quill': {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          height: '100%',
        },
        '& .ql-toolbar': {
          bgcolor: (theme) => theme.palette.background.paper,
          border: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontFamily: 'inherit',
        },
        '& .ql-container': {
          border: 'none',
          flexGrow: 1,
          overflowY: 'auto',
          fontSize: '16px',
          fontFamily: 'inherit',
        },
        '& .ql-editor': {
          minHeight: '100%',
          padding: '32px',
          color: (theme) => theme.palette.text.primary,
        },
        // Estilização p/ suporte a Dark/Light Mode no Quill
        '& .ql-picker-label, & .ql-picker-item': {
          color: (theme) => theme.palette.text.primary,
        },
        '& .ql-stroke': {
          stroke: (theme) => theme.palette.text.primary,
        },
        '& .ql-fill': {
          fill: (theme) => theme.palette.text.primary,
        },
        '& .ql-snow .ql-picker-options': {
          backgroundColor: (theme) => theme.palette.background.paper,
        }
      }}>
        <ReactQuill
          ref={reactQuillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
        />
      </Box>

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
          <Typography variant="body1" color="text.secondary">Cadernos, Textos e Ideias</Typography>
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