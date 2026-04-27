import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Button, FormControlLabel, Switch, IconButton, Tooltip, 
  Autocomplete, MenuItem, Snackbar, Alert, Chip, InputBase
} from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent } from '../../../types';
import { calendarService } from '../../../modules/calendar/CalendarService';
import { useTasksStore } from '../../../stores/tasksStore';

const EVENT_COLORS = [
  { id: '9', name: 'Oceano', hex: '#3f51b5' },
  { id: '2', name: 'Floresta', hex: '#33b679' },
  { id: '11', name: 'Vulcão', hex: '#d50000' },
  { id: '5', name: 'Raio de Sol', hex: '#f6bf26' },
  { id: '6', name: 'Fogo', hex: '#f5511d' },
  { id: '3', name: 'Nebulosa', hex: '#8e24aa' },
  { id: '4', name: 'Algodão Doce', hex: '#e67c73' }
];

const DEFAULT_ROLES = ['Trabalho', 'Casa', 'Faculdade', 'Profissional', 'Lazer', 'Saúde'];

const getColorHex = (colorId: string) => {
  const color = EVENT_COLORS.find(c => c.id === colorId);
  return color ? color.hex : '#3f51b5';
};

const CalendarView: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  
  const [events, setEvents] = useState<any[]>([]); // Atualizado para suportar Eventos do Google + Tarefas Internas
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });
  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ open: true, message, severity });
  };

  const [formData, setFormData] = useState({
    title: '', description: '', location: '', startDateTime: '', endDateTime: '',
    allDay: false, addMeet: false, attendees: [] as string[], colorId: '9', role: ''
  });
  
  const [emailInput, setEmailInput] = useState(''); 
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false);
  
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingCalendarId, setEditingCalendarId] = useState<string>('primary');
  const [draftEventId, setDraftEventId] = useState<string | null>(null);
  const [meetLinkDisplay, setMeetLinkDisplay] = useState<string | null>(null);

  // Integração com TasksStore
  const { tasks, loadTasks: loadStoreTasks } = useTasksStore();

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      
      // 1. Busca os Eventos Reais do Google Calendar
      const googleEvents = await calendarService.getCombinedEvents(startDate, endDate);
      const mappedGoogleEvents = googleEvents.map((e) => ({
        id: e.id, title: e.summary, start: e.start.dateTime || e.start.date, end: e.end.dateTime || e.end.date,
        backgroundColor: e.extendedProps?.isHoliday ? '#ec6c83' : getColorHex(e.colorId || '9'),
        borderColor: e.extendedProps?.isHoliday ? '#ec6c83' : getColorHex(e.colorId || '9'),
        classNames: e.extendedProps?.isHoliday ? ['fc-event-holiday'] : [],
        extendedProps: { ...e.extendedProps, colorId: e.colorId, isInternalTask: false },
        allDay: !e.start.dateTime
      }));

      // 2. Busca e Filtra Tarefas Internas (Somente com Data e Não Concluídas)
      await loadStoreTasks();
      const currentTasks = useTasksStore.getState().tasks;
      const internalTaskEvents = currentTasks.filter(t => t.dueDate && !t.completed).map((t) => ({
        id: `task-${t.id}`, title: t.title,
        start: t.dueDate, // String 'YYYY-MM-DD'
        allDay: true,
        backgroundColor: '#607d8b', // Uma cor "Blue Grey" sóbria para diferenciar de eventos do Google
        borderColor: '#607d8b',
        extendedProps: { isInternalTask: true, role: t.role, priority: t.priority }
      }));

      setEvents([...mappedGoogleEvents, ...internalTaskEvents]);
    } catch (err: any) {
      if (err.message && err.message.includes('Sessão expirada')) {
        showToast('Sessão expirada. Recarregando...', 'warning');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        if (!silent) showToast('Erro ao sincronizar calendário.', 'error');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [loadStoreTasks]);

  useEffect(() => {
    loadEvents();
    const onFocus = () => { if (!document.hidden) loadEvents(true); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadEvents]);

  const formatForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const buildServiceParams = (currentData: typeof formData, currentEmailInput: string, addMeetOverride = false) => {
    let startISO, endISO;
    if (currentData.allDay) {
      startISO = currentData.startDateTime.split('T')[0];
      endISO = currentData.endDateTime.split('T')[0];
    } else {
      startISO = new Date(currentData.startDateTime).toISOString();
      endISO = new Date(currentData.endDateTime).toISOString();
    }
    
    let finalAttendees = [...currentData.attendees];
    const pendingEmail = currentEmailInput.trim().replace(/,/g, '');
    if (pendingEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingEmail) && !finalAttendees.includes(pendingEmail)) {
      finalAttendees.push(pendingEmail);
    }

    return {
      summary: currentData.title || (addMeetOverride ? 'Nova Reunião Online' : '(Sem Título)'), description: currentData.description,
      location: currentData.location, startISO, endISO, allDay: currentData.allDay, addMeet: addMeetOverride || currentData.addMeet,
      attendees: finalAttendees, colorId: currentData.colorId, role: currentData.role
    };
  };

  const handleSelect = useCallback((info: { start: Date; end: Date; allDay: boolean; startStr: string }) => {
    const isAllDay = info.allDay || info.startStr.length === 10;
    let startStr, endStr;

    if (isAllDay) {
      const endInclusive = new Date(info.end.getTime() - 1);
      startStr = formatForInput(info.start);
      endStr = formatForInput(endInclusive);
    } else {
      startStr = formatForInput(info.start);
      endStr = formatForInput(info.end);
    }

    setFormData({ title: '', description: '', location: '', startDateTime: startStr, endDateTime: endStr, allDay: isAllDay, addMeet: false, attendees: [], colorId: '9', role: '' });
    setEmailInput('');
    setEditingEventId(null);
    setEditingCalendarId('primary');
    setDraftEventId(null);
    setMeetLinkDisplay(null);
    setDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((info: { event: any }) => {
    // Evita editar Feriados ou Tarefas Internas (Tarefas são editadas no To-Do)
    if (info.event.extendedProps.isHoliday) return;
    if (info.event.extendedProps.isInternalTask) {
      showToast('Edite esta tarefa na aba de To-Do.', 'info');
      return;
    }

    const ev = info.event;
    let startStr = ev.start ? formatForInput(ev.start) : '';
    let endStr = ev.end ? formatForInput(ev.end) : startStr;

    if (ev.allDay && ev.end) {
       const endInclusive = new Date(ev.end.getTime() - 1);
       endStr = formatForInput(endInclusive);
    }

    setFormData({
      title: ev.title, description: ev.extendedProps.description || '', location: ev.extendedProps.location || '',
      startDateTime: startStr, endDateTime: endStr, allDay: ev.allDay, addMeet: ev.extendedProps.hasMeet, attendees: ev.extendedProps.attendees || [],
      colorId: ev.extendedProps.colorId || '9', role: ev.extendedProps.role || ''
    });
    
    setEmailInput('');
    setMeetLinkDisplay(ev.extendedProps.hangoutLink || null);
    setEditingEventId(ev.id);
    setEditingCalendarId(ev.extendedProps.calendarId || 'primary');
    setDraftEventId(null);
    setDialogOpen(true);
  }, []);

  const handleToggleMeet = async (checked: boolean) => {
    let newLocation = formData.location;
    if (checked && !formData.location.trim()) newLocation = 'Online por Meet';

    setFormData(prev => ({ ...prev, addMeet: checked, location: newLocation }));
    
    if (checked && !draftEventId && !editingEventId) {
      setIsGeneratingMeet(true);
      try {
        const serviceParams = buildServiceParams({ ...formData, addMeet: checked, location: newLocation }, emailInput, true);
        const draft = await calendarService.createEvent('primary', serviceParams);
        setDraftEventId(draft.id);
        setMeetLinkDisplay(draft.hangoutLink || null);
        showToast('Link do Meet gerado com sucesso!', 'success');
      } catch (err: any) {
        showToast(`Google API: ${err.message}`, 'error');
        setFormData(prev => ({ ...prev, addMeet: false, location: prev.location === 'Online por Meet' ? '' : prev.location }));
      } finally {
        setIsGeneratingMeet(false);
      }
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) { showToast('Por favor, adicione um título.', 'warning'); return; }
    if (new Date(formData.endDateTime) < new Date(formData.startDateTime)) { showToast('A hora de término não pode ser anterior à de início.', 'warning'); return; }

    setIsSaving(true);
    try {
      const serviceParams = buildServiceParams(formData, emailInput);

      if (editingEventId) {
        await calendarService.updateEvent(editingCalendarId, editingEventId, serviceParams);
        showToast('Evento atualizado!', 'success');
      } else if (draftEventId) {
        await calendarService.updateEvent('primary', draftEventId, serviceParams);
        showToast('Evento salvo com sucesso!', 'success');
      } else {
        await calendarService.createEvent('primary', serviceParams);
        showToast('Novo evento criado!', 'success');
      }

      await loadEvents(true);
      handleCloseDialog(true);
    } catch (err: any) {
      showToast(`Erro ao salvar: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => setDeleteConfirmOpen(true);

  const handleDeleteEvent = async () => {
    const targetId = editingEventId || draftEventId;
    if (!targetId) return;

    setDeleteConfirmOpen(false);
    setIsSaving(true);
    try {
      await calendarService.deleteEvent(editingCalendarId, targetId);
      showToast('Evento removido da sua agenda.', 'success');
      await loadEvents(true);
      handleCloseDialog(true);
    } catch (err: any) {
      showToast(`Não foi possível remover: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDialog = async (isSaved = false) => {
    if (!isSaved && draftEventId) calendarService.deleteEvent('primary', draftEventId).catch(() => {});
    setDialogOpen(false);
    if (calendarRef.current) calendarRef.current.getApi().unselect();
  };

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      const newEmail = emailInput.trim().replace(/,/g, '');
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        e.preventDefault(); 
        if (!formData.attendees.includes(newEmail)) setFormData(prev => ({ ...prev, attendees: [...prev.attendees, newEmail] }));
        setEmailInput('');
      }
    } else if (e.key === 'Backspace' && emailInput === '' && formData.attendees.length > 0) {
      e.preventDefault();
      const lastEmail = formData.attendees[formData.attendees.length - 1];
      setFormData(prev => ({ ...prev, attendees: prev.attendees.slice(0, -1) }));
      setEmailInput(lastEmail); 
    }
  };

  const removeEmail = (emailToRemove: string) => setFormData(prev => ({ ...prev, attendees: prev.attendees.filter(e => e !== emailToRemove) }));

  if (isLoading && events.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', height: 400, alignItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, boxSizing: 'border-box' }}>
      <Paper sx={{ 
        height: 'calc(100vh - 120px)', p: 2, borderRadius: 2, 
        '& .fc': { height: '100%' }, '& .fc-event': { cursor: 'pointer' }, 
        '& .fc-timegrid-slot:hover': { backgroundColor: 'rgba(26, 115, 232, 0.08) !important', cursor: 'pointer' },
        '& .fc-daygrid-day:hover': { backgroundColor: 'rgba(26, 115, 232, 0.05) !important', cursor: 'pointer' },
        '& .fc-highlight': { backgroundColor: 'rgba(26, 115, 232, 0.25) !important' }
      }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
          events={events}
          selectable={true}
          selectMirror={true}
          unselectAuto={false} 
          slotDuration="00:15:00"
          slotLabelInterval="01:00"
          select={handleSelect}
          eventClick={handleEventClick}
          locale="pt-br" height="100%"
          
          eventContent={(arg) => {
            const isHoliday = arg.event.extendedProps?.isHoliday;
            const isInternalTask = arg.event.extendedProps?.isInternalTask;
            const role = arg.event.extendedProps?.role;
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', px: 0.5 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                   {isHoliday ? (
                     <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{arg.event.title}</Typography>
                   ) : (
                     <>
                       {/* Renderiza um Check se for Tarefa do To-Do, senão um icone do Meet se for Evento Google com Meet */}
                       {isInternalTask ? (
                         <CheckCircleOutlineIcon sx={{ fontSize: '0.75rem', flexShrink: 0 }} />
                       ) : (
                         arg.event.extendedProps?.hasMeet && <VideoCallIcon sx={{ fontSize: '0.75rem', flexShrink: 0 }} />
                       )}
                       
                       <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 500 }}>
                         {arg.event.title}
                       </Typography>
                     </>
                   )}
                 </Box>
                 {role && !isHoliday && (
                   <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.9, lineHeight: 1, fontWeight: 600, mt: 0.3 }}>• {role}</Typography>
                 )}
              </Box>
            );
          }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !isSaving && handleCloseDialog()} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>{editingEventId ? 'Editar Evento' : 'Novo Evento'}</Typography>
          <Box>
            {(editingEventId || draftEventId) && (
              <Tooltip title="Excluir">
                <IconButton onClick={confirmDelete} size="small" color="error" disabled={isSaving} sx={{ mr: 1 }}><DeleteIcon /></IconButton>
              </Tooltip>
            )}
            <IconButton onClick={() => handleCloseDialog()} size="small" disabled={isSaving}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="Aparência" value={formData.colorId} onChange={(e) => handleInputChange('colorId', e.target.value)} disabled={isSaving} sx={{ minWidth: 160 }}>
                {EVENT_COLORS.map((color) => (
                  <MenuItem key={color.id} value={color.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color.hex }} />
                      <Typography variant="body2">{color.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                freeSolo options={DEFAULT_ROLES} value={formData.role}
                onChange={(_, newValue) => handleInputChange('role', newValue || '')}
                onInputChange={(_, newInputValue) => handleInputChange('role', newInputValue)}
                fullWidth renderInput={(params) => <TextField {...params} label="Tag / Categoria" disabled={isSaving} placeholder="Ex: Trabalho" />}
              />
            </Box>

            <TextField label="O que vai acontecer?" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} fullWidth autoFocus disabled={isSaving} />
            <FormControlLabel control={<Switch checked={formData.allDay} onChange={(e) => handleInputChange('allDay', e.target.checked)} disabled={isSaving} />} label="O dia inteiro" />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Início" type={formData.allDay ? "date" : "datetime-local"} value={formData.allDay ? formData.startDateTime.slice(0, 10) : formData.startDateTime} onChange={(e) => handleInputChange('startDateTime', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} disabled={isSaving} />
              <TextField label="Fim" type={formData.allDay ? "date" : "datetime-local"} value={formData.allDay ? formData.endDateTime.slice(0, 10) : formData.endDateTime} onChange={(e) => handleInputChange('endDateTime', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} disabled={isSaving} />
            </Box>
            
            <TextField label="Onde?" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} fullWidth disabled={isSaving} placeholder="Endereço ou Online" />
            
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Convidados</Typography>
              <Box sx={{
                display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, minHeight: 48, border: '1px solid', borderColor: 'divider', borderRadius: 1, alignItems: 'center',
                bgcolor: isSaving ? 'action.disabledBackground' : 'transparent', '&:focus-within': { borderColor: 'primary.main', borderWidth: 2, m: '-1px' }
              }}>
                {formData.attendees.map((email, idx) => (
                  <Chip key={idx} label={email} onDelete={() => removeEmail(email)} size="small" sx={{ bgcolor: 'rgba(26, 115, 232, 0.08)', color: 'primary.main', borderRadius: 1, fontWeight: 500 }} />
                ))}
                <InputBase placeholder={formData.attendees.length === 0 ? "e-mails (espaço ou vírgula)" : ""} value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={handleEmailKeyDown} sx={{ flex: 1, minWidth: 150, fontSize: '0.875rem' }} disabled={isSaving} />
              </Box>
            </Box>

            <TextField label="Detalhes" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} fullWidth multiline rows={2} disabled={isSaving} />
            
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
              <FormControlLabel 
                control={<Switch checked={formData.addMeet} onChange={(e) => handleToggleMeet(e.target.checked)} disabled={isSaving || isGeneratingMeet || !!meetLinkDisplay} color="primary" />} 
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VideoCallIcon color="primary" /><Typography variant="body2">Adicionar Link do Google Meet</Typography></Box>} 
              />
              {isGeneratingMeet && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}><CircularProgress size={16} /><Typography variant="caption">Conectando ao Google...</Typography></Box>}
              {formData.addMeet && meetLinkDisplay && !isGeneratingMeet && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>{meetLinkDisplay}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => { navigator.clipboard.writeText(meetLinkDisplay); showToast('Link copiado!', 'info'); }}>Copiar</Button>
                    <Button size="small" variant="contained" startIcon={<OpenInNewIcon />} onClick={() => window.open(meetLinkDisplay, '_blank')}>Entrar na Sala</Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => handleCloseDialog()} color="inherit" disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSaveEvent} variant="contained" disableElevation disabled={!formData.title.trim() || isSaving || isGeneratingMeet}>
            {isSaving ? 'Salvando...' : 'Salvar Evento'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}><WarningAmberIcon /> Excluir Evento</DialogTitle>
        <DialogContent><Typography>Tem certeza que deseja excluir <strong>{formData.title}</strong> definitivamente da sua agenda?</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleDeleteEvent} variant="contained" color="error" disableElevation>Excluir Evento</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast(prev => ({ ...prev, open: false }))} severity={toast.severity} variant="filled" sx={{ width: '100%', boxShadow: 3 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CalendarView;