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

interface RoutingProfile {
  id: number;
  name: string;
  config: string;
}

export default function RoutingProfilesPage() {
  const [profiles, setProfiles] = useState<RoutingProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [config, setConfig] = useState('');
  const { showToast } = useToast();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = useCallback(async () => {
    const res = await api.get('/routing-profiles');
    setProfiles(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setConfig('');
    setOpen(true);
  };

  const handleOpenEdit = (profile: RoutingProfile) => {
    setEditingId(profile.id);
    setName(profile.name);
    setConfig(profile.config);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Введите название профиля', 'error'); return; }
    const payload = { name, config };
    try {
      if (editingId) {
        await api.put(`/routing-profiles/${editingId}`, payload);
      } else {
        await api.post('/routing-profiles', payload);
      }
      setOpen(false);
      load();
      showToast(editingId ? 'Профиль обновлён' : 'Профиль создан', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка сохранения';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/routing-profiles/${id}`);
      load();
      showToast('Профиль удалён', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка удаления';
      showToast(message, 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Название', width: 250 },
    {
      field: 'config',
      headerName: 'Конфиг',
      width: 500,
      renderCell: (params) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 480 }}>
          {params.row.config?.substring(0, 120)}{params.row.config?.length > 120 ? '...' : ''}
        </Typography>
      ),
    },
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
        <Typography variant={isMobile ? 'h5' : 'h4'}>Routing Profiles</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Создать</Button>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <EnhancedDataGrid rows={profiles} columns={columns} getRowId={(row) => row.id} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Редактировать профиль' : 'Новый профиль'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Название" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField margin="dense" label="Конфиг (JSON или base64)" fullWidth multiline rows={8} value={config} onChange={(e) => setConfig(e.target.value)} placeholder='{"Name":"MyProfile","GlobalProxy":"true","DirectSites":["geosite:cn"]}' />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
