import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { EnhancedDataGrid, type GridColDef } from '../components/EnhancedDataGrid';
import api from '../api';
import { useToast } from '../components/ToastProvider';

interface Customer {
  id: number;
  name: string;
  email?: string;
  telegram?: string;
  groupId?: number;
  group?: { id: number; name: string };
}

interface CustomerGroup {
  id: number;
  name: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const { showToast } = useToast();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = useCallback(async () => {
    const [custRes, groupsRes] = await Promise.all([
      api.get('/customers'),
      api.get('/customer-groups'),
    ]);
    setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
    setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName(''); setEmail(''); setTelegram(''); setGroupId('');
    setOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name); setEmail(c.email || ''); setTelegram(c.telegram || ''); setGroupId(c.groupId || '');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('Введите имя', 'error'); return; }
    const payload = { name: name.trim(), email: email.trim() || undefined, telegram: telegram.trim() || undefined, groupId: groupId || undefined };
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      setOpen(false);
      load();
      showToast(editingId ? 'Клиент обновлён' : 'Клиент создан', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка сохранения';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/customers/${id}`);
      load();
      showToast('Клиент удалён', 'success');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ошибка удаления';
      showToast(message, 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Имя', width: 200 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'telegram', headerName: 'Telegram', width: 180 },
    {
      field: 'group',
      headerName: 'Группа',
      width: 180,
      valueGetter: (_value, row) => row.group?.name || '',
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
        <Typography variant={isMobile ? 'h5' : 'h4'}>Клиенты</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>Создать</Button>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <EnhancedDataGrid rows={customers} columns={columns} getRowId={(row) => row.id} />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Имя" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField margin="dense" label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField margin="dense" label="Telegram" fullWidth value={telegram} onChange={(e) => setTelegram(e.target.value)} sx={{ mb: 2 }} />
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Группа</InputLabel>
            <Select value={groupId} label="Группа" onChange={(e) => setGroupId(e.target.value as number | '')}>
              <MenuItem value="">Без группы</MenuItem>
              {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
