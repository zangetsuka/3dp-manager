import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, CheckCircle, Delete, Dns, Error, Terminal } from '@mui/icons-material';
import { EnhancedDataGrid, type GridColDef } from '../components/EnhancedDataGrid';
import api from '../api';
import { getApiErrorMessage } from '../utils/errorHandlers';
import { Logger } from '../utils/logger';
import type { NodeRecord } from '../types/node';
import { useToast } from '../components/ToastProvider';

interface Tunnel {
  id: number;
  name: string;
  ip: string;
  domain?: string;
  sshPort: number;
  username: string;
  isInstalled: boolean;
  nodeId?: string;
  node?: NodeRecord;
}

const emptyForm = {
  name: '',
  nodeId: '',
  ip: '',
  sshPort: 22,
  username: 'root',
  password: '',
  privateKey: '',
  domain: '',
};

export default function TunnelsPage() {
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password');
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    confirmText: 'Подтвердить',
    confirmColor: 'primary' as 'primary' | 'error',
    onConfirm: () => {},
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mainNode = useMemo(() => nodes.find((node) => node.isMain), [nodes]);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Название', width: 200 },
    {
      field: 'nodeName',
      headerName: 'Нода',
      width: 200,
      valueGetter: (_value, row) => row.node?.name || '-',
    },
    {
      field: 'address',
      headerName: 'Адрес',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Dns fontSize="small" color="action" />
          {params.row.domain || params.row.ip}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Статус',
      width: 160,
      renderCell: (params) =>
        params.row.isInstalled ? (
          <Chip icon={<CheckCircle />} label="Активен" color="success" size="small" variant="outlined" />
        ) : (
          <Chip icon={<Error />} label="Не установлен" color="warning" size="small" variant="outlined" />
        ),
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          {!params.row.isInstalled && (
            <Button
              startIcon={loadingId === params.row.id ? <CircularProgress size={20} /> : <Terminal />}
              disabled={loadingId !== null}
              onClick={() => handleInstall(params.row.id)}
              sx={{ mr: 1 }}
              variant="outlined"
              size="small"
            >
              Установить
            </Button>
          )}
          <IconButton color="error" disabled={loadingId !== null} onClick={() => handleDelete(params.row)}>
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  const loadData = useCallback(async () => {
    try {
      const [tunnelsRes, nodesRes] = await Promise.all([
        api.get<Tunnel[]>('/tunnels'),
        api.get<NodeRecord[]>('/nodes'),
      ]);
      setTunnels(Array.isArray(tunnelsRes.data) ? tunnelsRes.data : []);
      setNodes(Array.isArray(nodesRes.data) ? nodesRes.data : []);
    } catch (error) {
      Logger.error('Failed to load forwarding data', 'Tunnels', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isValidIp = (value: string) =>
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value.trim()) ||
    /^([0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}$/i.test(value.trim());
  const isValidDomain = (value: string) =>
    /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value.trim());
  const isValidAddress = (value: string) => isValidIp(value) || isValidDomain(value);

  const selectedNode = nodes.find((node) => node.id === form.nodeId) || mainNode;

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Введите название relay сервера';
    if (!selectedNode) errors.nodeId = 'Добавьте или выберите ноду';
    if (!isValidAddress(form.ip)) errors.ip = 'Введите корректный IP или домен relay сервера';
    if (!form.sshPort || form.sshPort < 1 || form.sshPort > 65535) {
      errors.sshPort = 'Порт должен быть от 1 до 65535';
    }
    if (!form.username.trim()) errors.username = 'Введите SSH пользователя';
    if (authMethod === 'password' && !form.password) errors.password = 'Введите SSH пароль';
    if (authMethod === 'key' && !form.privateKey.trim()) errors.privateKey = 'Введите SSH ключ';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange =
    (prop: keyof typeof emptyForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [prop]: event.target.value }));
    };

  const resetForm = () => {
    setForm({ ...emptyForm, nodeId: mainNode?.id || '' });
    setAuthMethod('password');
    setFormErrors({});
  };

  const openCreate = () => {
    if (nodes.length === 0) {
      showToast('Создайте хотя бы одну ноду!', 'error');
      return;
    }
    resetForm();
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      showToast('Исправьте ошибки в форме', 'error');
      return;
    }

    const payload = {
      ...form,
      nodeId: form.nodeId || mainNode?.id,
      password: authMethod === 'password' ? form.password : undefined,
      privateKey: authMethod === 'key' ? form.privateKey : undefined,
    };

    try {
      await api.post('/tunnels', payload);
      setOpen(false);
      resetForm();
      loadData();
      showToast('Relay сервер добавлен', 'success');
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Не удалось добавить relay сервер'), 'error');
    }
  };

  const handleInstall = (id: number) => {
    setConfirmDialog({
      open: true,
      title: 'Установить перенаправление на выбранный сервер?',
      confirmText: 'Установить',
      confirmColor: 'primary',
      onConfirm: async () => {
        setLoadingId(id);
        try {
          await api.post(`/tunnels/${id}/install`);
          showToast('Перенаправление установлено', 'success');
          loadData();
        } catch (error) {
          showToast(getApiErrorMessage(error, 'Ошибка установки'), 'error');
        } finally {
          setLoadingId(null);
        }
      },
    });
  };

  const handleDelete = (tunnel: Tunnel) => {
    const deleteForwarding =
      tunnel.isInstalled &&
      window.confirm('Удалить перенаправление на сервере через forwarding_delete.sh (приведет сервер к первоначальному состоянию)? Нажмите Ок для подтверждения.');

    setConfirmDialog({
      open: true,
      title: deleteForwarding
        ? 'Удалить relay и выполнить удаление перенаправления на сервере?'
        : 'Удалить relay сервер только из списка?',
      confirmText: 'Удалить',
      confirmColor: 'error',
      onConfirm: async () => {
        setLoadingId(tunnel.id);
        try {
          await api.delete(`/tunnels/${tunnel.id}`, { params: { deleteForwarding } });
          showToast('Relay сервер удалён', 'success');
          loadData();
        } catch (error) {
          showToast(getApiErrorMessage(error, 'Ошибка удаления'), 'error');
        } finally {
          setLoadingId(null);
        }
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>Relay серверы</Typography>
        <Box><Button variant="contained" startIcon={<Add />} onClick={openCreate}>Добавить</Button></Box>
        
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <EnhancedDataGrid
          rows={tunnels}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новый relay сервер</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Название" required fullWidth value={form.name} onChange={handleChange('name')} error={!!formErrors.name} helperText={formErrors.name} />
          <FormControl fullWidth required margin="dense" error={!!formErrors.nodeId}>
            <InputLabel>Нода</InputLabel>
            <Select value={form.nodeId || mainNode?.id || ''} label="Нода" onChange={(event) => setForm((prev) => ({ ...prev, nodeId: event.target.value }))}>
              {nodes.map((node) => (
                <MenuItem key={node.id} value={node.id}>{node.name}{node.isMain ? ' (основная)' : ''}</MenuItem>
              ))}
            </Select>
            {formErrors.nodeId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formErrors.nodeId}</Typography>}
          </FormControl>
          <TextField margin="dense" label="IP или домен relay сервера" required fullWidth value={form.ip} onChange={handleChange('ip')} error={!!formErrors.ip} helperText={formErrors.ip} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField margin="dense" label="SSH порт" required type="number" fullWidth value={form.sshPort} onChange={handleChange('sshPort')} error={!!formErrors.sshPort} helperText={formErrors.sshPort} />
            <TextField margin="dense" label="SSH пользователь" required fullWidth value={form.username} onChange={handleChange('username')} error={!!formErrors.username} helperText={formErrors.username} />
          </Box>
          <FormControl component="fieldset" sx={{ mt: 2, mb: 1 }}>
            <RadioGroup row value={authMethod} onChange={(e) => setAuthMethod(e.target.value as 'password' | 'key')}>
              <FormControlLabel value="password" control={<Radio />} label="По паролю" />
              <FormControlLabel value="key" control={<Radio />} label="По SSH ключу" />
            </RadioGroup>
          </FormControl>

          {authMethod === 'password' ? (
            <TextField margin="dense" label="SSH пароль" required type="password" fullWidth value={form.password} onChange={handleChange('password')} error={!!formErrors.password} helperText={formErrors.password} />
          ) : (
            <TextField margin="dense" label="SSH private key" required multiline rows={4} fullWidth value={form.privateKey} onChange={handleChange('privateKey')} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: '0.875rem' } } }} error={!!formErrors.privateKey} helperText={formErrors.privateKey} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleCreate}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent><Typography>{confirmDialog.title}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Отмена</Button>
          <Button onClick={() => { setConfirmDialog({ ...confirmDialog, open: false }); confirmDialog.onConfirm(); }} variant="contained" color={confirmDialog.confirmColor}>{confirmDialog.confirmText}</Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
}
