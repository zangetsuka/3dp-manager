import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { EnhancedDataGrid, type GridColDef } from '../components/EnhancedDataGrid';
import api from '../api';
import { useToast } from '../components/ToastProvider';

interface CustomerGroup {
  id: number;
  name: string;
  description?: string;
}

export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { showToast } = useToast();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = useCallback(async () => {
    const res = await api.get('/customer-groups');
    setGroups(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName(''); setDescription('');
    setOpen(true);
  };

  const handleOpenEdit = (g: CustomerGroup) => {
    setEditingId(g.id);
    setName(g.name); setDescription(g.description || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Введите название группы', 'error'); return; }
    const payload = { name: name.trim(), description: description.trim() || undefined };
    try {
      if (editingId) {
        await api.put(`/customer-groups/${editingId}`, payload);
      } else {
        await api.post('/customer-groups', payload);
      }
      setOpen(false);
      load();
      showToast(editingId ? 'Группа обновлена' : 'Группа создана', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка сохранения';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/customer-groups/${id}`);
      load();
      showToast('Группа удалена', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка удаления';
      showToast(message, 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Название', width: 250 },
    { field: 'description', headerName: 'Описание', width: 400 },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleOpenEdit(params.row)}><Edit /></IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} color="error"><Delete /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>Группы клиентов</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Создать</Button>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <EnhancedDataGrid rows={groups} columns={columns} getRowId={(row) => row.id} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Редактировать группу' : 'Новая группа'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Название" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField margin="dense" label="Описание" fullWidth multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
