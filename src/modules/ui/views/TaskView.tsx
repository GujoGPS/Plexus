import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, FormControl, InputLabel, Button, Checkbox,
  IconButton, Tabs, Tab, List, ListItem, ListItemIcon, Chip,
  CircularProgress, TextField as MuiTextField, InputAdornment, Accordion,
  AccordionSummary, AccordionDetails, Rating, Select, MenuItem, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NoteIcon from '@mui/icons-material/Note';

import { useTasksStore } from '../../../stores/tasksStore';
import { useNotesStore } from '../../../stores/notesStore';
import { useUiStore } from '../../../stores/uiStore';
import { Task } from '../../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const DEFAULT_ROLES = ['Trabalho', 'Casa', 'Faculdade', 'Profissional', 'Lazer', 'Saúde'];

const priorityColors: Record<string, string> = {
  q1: '#d50000', q2: '#33b679', q3: '#f6bf26', q4: '#9e9e9e',
  high: '#d50000', medium: '#f6bf26', low: '#33b679',
};

const dropdownPriorityLabels: Record<string, string> = {
  q1: 'Urgente & Importante (Fazer)', q2: 'Importante, Não Urgente (Agendar)',
  q3: 'Urgente, Não Importante (Delegar)', q4: 'Não Urgente, Não Imp. (Eliminar)',
};

const chipPriorityLabels: Record<string, string> = {
  q1: 'Fazer Agora', q2: 'Agendar', q3: 'Delegar', q4: 'Eliminar',
  high: 'Alta', medium: 'Média', low: 'Baixa',
};

const energyColors: Record<number, string> = {
  1: '#ea4335', 2: '#f57c00', 3: '#fbbc04', 4: '#4caf50', 5: '#34a853',
};

// ============================================================================
// TASK ITEM COMPONENT
// ============================================================================
interface TaskItemProps {
  task: Task;
  index: number;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  provided?: any; 
  snapshot?: any; 
}

const TaskItem: React.FC<TaskItemProps> = ({
  task, onToggleComplete, onDelete, onEdit,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
  provided, snapshot
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const { activeEntityId, clearActiveEntity, navigateToItem } = useUiStore();
  const { notes } = useNotesStore();

  useEffect(() => {
    if (activeEntityId === task.id) {
      setExpanded(true);
      clearActiveEntity();
    }
  }, [activeEntityId, task.id, clearActiveEntity]);

  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const linkedNotes = notes.filter(n => n.linkedTaskId === task.id);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <ListItem
      disablePadding
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      sx={{ 
        display: 'block', mb: 1,
        ...(snapshot?.isDragging ? {
          opacity: 0.95,
          transform: 'scale(1.02)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          zIndex: 9999,
          borderRadius: 2
        } : {})
      }}
    >
      <Accordion
        expanded={expanded}
        onChange={(_, isExpanded) => setExpanded(isExpanded)}
        sx={{
          bgcolor: 'background.paper', borderRadius: 2, boxShadow: snapshot?.isDragging ? 'none' : '0px 1px 3px rgba(0,0,0,0.12)',
          '&:before': { display: 'none' }, opacity: task.completed ? 0.7 : 1,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', m: 0, p: 0 } }}
        >
          {!task.completed && (
            <Tooltip title="Arraste para reordenar">
              <Box 
                {...provided?.dragHandleProps} 
                sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: 'action.active', pl: 1, '&:active': { cursor: 'grabbing' } }}
              >
                <DragIndicatorIcon fontSize="small" />
              </Box>
            </Tooltip>
          )}

          <ListItemIcon sx={{ minWidth: 40, ml: task.completed ? 1 : 0 }}>
            <Checkbox
              edge="start" checked={task.completed} onChange={() => onToggleComplete(task.id)}
              color="success" onClick={(e) => e.stopPropagation()}
            />
          </ListItemIcon>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'text.secondary' : 'text.primary', fontWeight: 500 }}>
                {task.title}
              </Typography>
              {task.role && <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>• {task.role}</Typography>}
              
              <Chip 
                label={chipPriorityLabels[task.priority] || task.priority} 
                size="small" 
                sx={{ 
                  bgcolor: priorityColors[task.priority], 
                  color: theme.palette.getContrastText(priorityColors[task.priority]), // COR ADAPTATIVA
                  fontSize: '0.7rem', height: 20, fontWeight: 600 
                }} 
              />

              {task.energy && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BatteryChargingFullIcon fontSize="small" sx={{ color: energyColors[task.energy], fontSize: '1rem' }} />
                  <Typography variant="caption" sx={{ color: energyColors[task.energy], fontWeight: 600 }}>{task.energy}</Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
              {task.dueDate && (
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 500 }}>
                  <CalendarTodayIcon sx={{ fontSize: '0.8rem' }} /> {formatDate(task.dueDate)}
                </Typography>
              )}
              {totalSubtasks > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {completedSubtasks}/{totalSubtasks} subtarefas
                </Typography>
              )}

              {linkedNotes.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {linkedNotes.map(n => (
                    <Chip 
                      key={n.id}
                      icon={<NoteIcon sx={{ fontSize: '0.8rem !important' }} />}
                      label={n.title || 'Caderno'}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToItem('notas', n.id);
                      }}
                      sx={{ 
                        height: 20, fontSize: '0.65rem', cursor: 'pointer',
                        '&:hover': { 
                          bgcolor: 'secondary.light', 
                          color: theme.palette.secondary.contrastText // COR ADAPTATIVA NO HOVER
                        } 
                      }} 
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }} onClick={(e) => e.stopPropagation()}>
             <IconButton size="small" onClick={() => onEdit(task)} color="primary"><EditIcon fontSize="small" /></IconButton>
             <IconButton size="small" onClick={() => onDelete(task.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Box sx={{ pl: 6, pr: 2, pb: 2 }}>
            {totalSubtasks > 0 && (
              <Box sx={{ mb: 2 }}>
                {(task.subtasks || []).map((subtask) => (
                  <Box key={subtask.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                    <Checkbox size="small" checked={subtask.completed} onChange={() => onToggleSubtask(task.id, subtask.id)} color="success" />
                    <Typography variant="body2" sx={{ flexGrow: 1, textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'text.secondary' : 'text.primary' }}>
                      {subtask.title}
                    </Typography>
                    <IconButton size="small" onClick={() => onDeleteSubtask(task.id, subtask.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <MuiTextField
                size="small" placeholder="Adicionar subtarefa..." value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                fullWidth
                InputProps={{
                  endAdornment: newSubtaskTitle.trim() && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleAddSubtask}><AddIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </ListItem>
  );
};

// ============================================================================
// MAIN TASK VIEW COMPONENT
// ============================================================================
const TaskView: React.FC = () => {
  const {
    tasks, archivedTasks, isLoading, error, loadTasks, addTask, updateTask,
    deleteTask, toggleComplete, addSubtask, toggleSubtask, deleteSubtask, reorderTasks
  } = useTasksStore();
  
  const { loadNotes } = useNotesStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('q1');
  const [newTaskRole, setNewTaskRole] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskEnergy, setNewTaskEnergy] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => { 
    loadTasks();
    loadNotes();
  }, [loadTasks, loadNotes]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await addTask(newTaskTitle.trim(), newTaskPriority, newTaskDueDate || null, [], newTaskEnergy || undefined, newTaskRole.trim());
      setNewTaskTitle('');
      setNewTaskPriority('q1');
      setNewTaskRole('');
      setNewTaskDueDate('');
      setNewTaskEnergy(null);
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editingTask.title.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateTask(editingTask.id, editingTask);
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    reorderTasks(result.source.index, result.destination.index);
  };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 3 }}><Typography color="error">Erro: {error}</Typography><Button onClick={() => loadTasks()} sx={{ mt: 2 }}>Tentar novamente</Button></Box>;

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, boxSizing: 'border-box' }}>
      
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary">
          O que você precisa fazer?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          <TextField
            label="Descrição da tarefa" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleAddTask(); }}
            sx={{ width: { xs: '100%', sm: '100%', md: 'auto' }, flexGrow: 1 }}
            placeholder="Ex: Pagar a conta de luz..."
          />
          
          <FormControl sx={{ minWidth: { xs: '100%', sm: '48%', md: 240 } }}>
            <InputLabel>Matriz de Eisenhower</InputLabel>
            <Select value={newTaskPriority} label="Matriz de Eisenhower" onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}>
              <MenuItem value="q1">{dropdownPriorityLabels['q1']}</MenuItem>
              <MenuItem value="q2">{dropdownPriorityLabels['q2']}</MenuItem>
              <MenuItem value="q3">{dropdownPriorityLabels['q3']}</MenuItem>
              <MenuItem value="q4">{dropdownPriorityLabels['q4']}</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            freeSolo options={DEFAULT_ROLES} value={newTaskRole}
            onChange={(_, newValue) => setNewTaskRole(newValue || '')}
            onInputChange={(_, newInputValue) => setNewTaskRole(newInputValue)}
            sx={{ minWidth: { xs: '100%', sm: '48%', md: 160 } }}
            renderInput={(params) => <TextField {...params} label="Tag / Categoria" placeholder="Ex: Casa" />}
          />

          <TextField
            label="Data (Opcional)" type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: { xs: '100%', sm: '48%', md: 140 } }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>Energia exigida:</Typography>
            <Rating
              value={newTaskEnergy} onChange={(_, value) => setNewTaskEnergy(value)} max={5}
              icon={<BatteryChargingFullIcon fontSize="inherit" />} emptyIcon={<BatteryChargingFullIcon fontSize="inherit" sx={{ opacity: 0.3 }} />}
              sx={{ '& .MuiRating-iconFilled': { color: energyColors[newTaskEnergy || 1] } }}
            />
          </Box>

          <Button variant="contained" onClick={handleAddTask} disabled={!newTaskTitle.trim()} sx={{ width: { xs: '100%', md: 'auto' }, height: 56, ml: 'auto' }}>
            Adicionar
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          textColor="primary" 
          indicatorColor="primary"
        >
          <Tab label={`Pendentes (${tasks.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Concluídas (${archivedTasks.length})`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Box role="tabpanel" hidden={tabValue !== 0}>
            {tasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">Você não tem nenhuma tarefa pendente. Parabéns! 🎉</Typography></Box>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="pending-tasks">
                  {(provided) => (
                    <List 
                      {...provided.droppableProps} 
                      ref={provided.innerRef} 
                      sx={{ p: 0 }}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <TaskItem 
                              task={task} 
                              index={index}
                              provided={provided}
                              snapshot={snapshot}
                              onToggleComplete={toggleComplete} 
                              onDelete={deleteTask} 
                              onEdit={setEditingTask}
                              onAddSubtask={addSubtask} 
                              onToggleSubtask={toggleSubtask} 
                              onDeleteSubtask={deleteSubtask}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </Box>

          <Box role="tabpanel" hidden={tabValue !== 1}>
            {archivedTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">Nenhuma tarefa concluída ainda.</Typography></Box>
            ) : (
              <List sx={{ p: 0 }}>
                {archivedTasks.map((task, index) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    index={index}
                    onToggleComplete={toggleComplete} 
                    onDelete={deleteTask} 
                    onEdit={setEditingTask}
                    onAddSubtask={addSubtask} 
                    onToggleSubtask={toggleSubtask} 
                    onDeleteSubtask={deleteSubtask}
                  />
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Paper>

      <Dialog open={!!editingTask} onClose={() => setEditingTask(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Tarefa</DialogTitle>
        <DialogContent dividers>
          {editingTask && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Descrição" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} fullWidth disabled={isSavingEdit} />
              
              <FormControl fullWidth disabled={isSavingEdit}>
                <InputLabel>Matriz de Eisenhower</InputLabel>
                <Select value={editingTask.priority} label="Matriz de Eisenhower" onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}>
                  <MenuItem value="q1">{dropdownPriorityLabels['q1']}</MenuItem>
                  <MenuItem value="q2">{dropdownPriorityLabels['q2']}</MenuItem>
                  <MenuItem value="q3">{dropdownPriorityLabels['q3']}</MenuItem>
                  <MenuItem value="q4">{dropdownPriorityLabels['q4']}</MenuItem>
                </Select>
              </FormControl>
              
              <Autocomplete
                freeSolo options={DEFAULT_ROLES} value={editingTask.role || ''}
                disabled={isSavingEdit}
                onChange={(_, newValue) => setEditingTask({ ...editingTask, role: newValue || '' })}
                onInputChange={(_, newInputValue) => setEditingTask({ ...editingTask, role: newInputValue })}
                renderInput={(params) => <TextField {...params} label="Tag / Categoria" />}
              />
              
              <TextField label="Data" type="date" value={editingTask.dueDate || ''} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth disabled={isSavingEdit} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>Energia exigida:</Typography>
                <Rating
                  disabled={isSavingEdit}
                  value={editingTask.energy || null} onChange={(_, value) => setEditingTask({ ...editingTask, energy: value || undefined })} max={5}
                  icon={<BatteryChargingFullIcon fontSize="inherit" />} emptyIcon={<BatteryChargingFullIcon fontSize="inherit" sx={{ opacity: 0.3 }} />}
                  sx={{ '& .MuiRating-iconFilled': { color: energyColors[editingTask.energy || 1] } }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTask(null)} color="inherit" disabled={isSavingEdit}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editingTask?.title.trim() || isSavingEdit}>
            {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskView;