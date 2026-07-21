import { useCallback, useEffect, useState } from 'react';
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
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Delete,
  Edit,
  Star,
  StarBorder,
  Sync,
} from '@mui/icons-material';
import { EnhancedDataGrid, type GridColDef } from '../components/EnhancedDataGrid';
import api from '../api';
import { nodesApi } from '../features/nodes/api';
import type { NodeAuthType, NodePayload, NodeRecord } from '../types/node';
import { getApiErrorMessage } from '../utils/errorHandlers';
import { FlagIcon, FlagOptionLabel } from '../utils/flags';
import { useToast } from '../components/ToastProvider';

const emptyForm: NodePayload = {
  name: '',
  url: '',
  ip: '',
  flag: '',
  authType: 'token',
  login: '',
  password: '',
  token: '',
  isMain: false,
};

interface CountryOption {
  name: string;
  code: string;
  emoji: string;
}

const isValidIp = (value?: string) =>
  !!value &&
  (/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value.trim()) ||
    /^([0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}$/i.test(value.trim()));

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NodeRecord | null>(null);
  const [form, setForm] = useState<NodePayload>(emptyForm);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NodeRecord | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NodePayload, string>>>({});
  const { showToast } = useToast();

  const loadNodes = useCallback(async () => {
    const data = await nodesApi.list();
    setNodes(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadNodes();
    api.get<CountryOption[]>('/settings/countries').then((res) => setCountries(Array.isArray(res.data) ? res.data : []));
  }, [loadNodes]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (node: NodeRecord) => {
    setEditing(node);
    setForm({
      name: node.name,
      url: node.url || '',
      ip: node.ip || '',
      flag: node.flag || '',
      authType: node.authType,
      login: node.login || '',
      password: '',
      token: '',
      isMain: node.isMain,
      version: node.version || '',
    });
    setFormErrors({});
    setOpen(true);
  };

  const updateField = <K extends keyof NodePayload>(key: K, value: NodePayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateForm = (requireSecrets = !editing) => {
    const errors: Partial<Record<keyof NodePayload, string>> = {};

    if (!form.name.trim()) errors.name = 'Введите название ноды';
    if (!form.url.trim()) errors.url = 'Введите URL панели 3x-ui';
    if (!isValidIp(form.ip)) errors.ip = 'Введите корректный IP ноды';
    if (!form.flag) errors.flag = 'Выберите флаг ноды';

    if (form.authType === 'password') {
      if (!form.login?.trim()) errors.login = 'Введите логин';
      if (requireSecrets && !form.password?.trim()) errors.password = 'Введите пароль';
    }

    if (form.authType === 'token' && requireSecrets && !form.token?.trim()) {
      errors.token = 'Введите токен';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const detectNodeLocation = async () => {
    const url = form.url.trim();
    if (!url) return;

    setDetectingLocation(true);
    try {
      const result = await nodesApi.detectLocation(url.replace(/\/+$/, ''));
      setForm((prev) => ({
        ...prev,
        ip: result.ip || prev.ip,
        flag: result.flag || prev.flag,
      }));
      if (result.country || result.ip) {
        showToast(`Определено: ${result.country || 'страна неизвестна'}${result.ip ? `, IP ${result.ip}` : ''}`, 'success');
      }
    } catch {
      showToast('Не удалось определить страну ноды', 'error');
    } finally {
      setDetectingLocation(false);
    }
  };

  const saveNode = async () => {
    if (!validateForm(!editing)) {
      showToast('Заполните обязательные поля', 'error');
      return;
    }

    const payload: NodePayload = {
      ...form,
      url: form.url.replace(/\/+$/, ''),
      ip: form.ip || undefined,
      flag: form.flag || undefined,
      login: form.authType === 'password' ? form.login : undefined,
      password: form.authType === 'password' && form.password ? form.password : undefined,
      token: form.authType === 'token' && form.token ? form.token : undefined,
    };

    try {
      if (editing) {
        await nodesApi.update(editing.id, payload);
      } else {
        await nodesApi.create(payload);
      }

      setOpen(false);
      showToast(editing ? 'Нода обновлена' : 'Нода добавлена', 'success');
      loadNodes();
    } catch (error: unknown) {
      const text =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Не удалось сохранить ноду';
      showToast(text, 'error');
    }
  };

  const checkFormConnection = async () => {
    if (!validateForm(true)) {
      showToast('Заполните обязательные поля для проверки подключения', 'error');
      return;
    }

    const result = await nodesApi.checkPayload({
      ...form,
      url: form.url.replace(/\/+$/, ''),
      login: form.authType === 'password' ? form.login : undefined,
      password: form.authType === 'password' ? form.password : undefined,
      token: form.authType === 'token' ? form.token : undefined,
    });

    showToast(result.success ? 'Подключение успешно' : 'Не удалось подключиться', result.success ? 'success' : 'error');
  };

  const checkNode = async (node: NodeRecord) => {
    setCheckingId(node.id);
    try {
      const result = await nodesApi.check(node.id);
      showToast(result.success ? 'Подключение успешно' : 'Не удалось подключиться', result.success ? 'success' : 'error');
      loadNodes();
    } finally {
      setCheckingId(null);
    }
  };

  const syncNodes = async () => {
    const result = await nodesApi.syncFromMain();
    showToast(`Синхронизировано нод: ${result.count}`, 'success');
    loadNodes();
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Название',
      width: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => nodesApi.setMain(params.row.id).then(loadNodes)} title={params.row.isMain ? '' : 'Сделать основной'}>
            {params.row.isMain ? <Star color="warning" /> : <StarBorder />}
          </IconButton>
          <Typography fontWeight={700}>{params.row.name}</Typography>
        </Stack>
      ),
    },
    {
      field: 'flag',
      headerName: 'Флаг',
      width: 80,
      renderCell: (params) => <FlagIcon flag={params.row.flag} />,
    },
    { field: 'ip', headerName: 'IP', width: 160 },
    { field: 'url', headerName: 'URL панели', width: 300 },
    { field: 'authType', headerName: 'Авторизация', width: 130 },
    {
      field: 'status',
      headerName: 'Статус',
      width: 130,
      renderCell: (params) =>
        params.row.isMain ? <Chip icon={<CheckCircle />} label="Основная" color="success" size="small" /> : null,
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => openEdit(params.row)}>
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => setDeleteTarget(params.row)}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const removeNode = async () => {
    if (!deleteTarget) return;
    try {
      await nodesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Нода удалена', 'success');
      loadNodes();
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Ошибка удаления ноды'), 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4">Ноды</Typography>
        </Box>
        <Box>
          <Stack direction="row" spacing={1}>
            {/* <Button startIcon={<Sync />} variant="outlined" onClick={syncNodes}>
              Синхронизировать
            </Button> */}
            <Button startIcon={<Add />} variant="contained" onClick={openCreate}>
              Добавить
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <EnhancedDataGrid
          rows={nodes}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Редактировать ноду' : 'Новая нода'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Название"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="URL панели 3x-ui"
              required
              helperText={formErrors.url || 'Например: https://85.198.84.27:35366/2vIsDA5HanQ3R7JyIH'}
              value={form.url}
              onChange={(e) => updateField('url', e.target.value)}
              onBlur={detectNodeLocation}
              error={!!formErrors.url}
              InputProps={{ endAdornment: detectingLocation ? <CircularProgress size={18} /> : undefined }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="IP ноды"
                required
                fullWidth
                value={form.ip || ''}
                onChange={(e) => updateField('ip', e.target.value)}
                error={!!formErrors.ip}
                helperText={formErrors.ip}
              />
              <FormControl fullWidth required error={!!formErrors.flag}>
                <InputLabel>Флаг</InputLabel>
                <Select
                  value={form.flag || ''}
                  label="Флаг"
                  onChange={(e) => updateField('flag', e.target.value)}
                  renderValue={(value) => (
                    <FlagOptionLabel flag={value} label={countries.find((country) => country.emoji === value)?.name || 'Флаг'} />
                  )}
                >
                  <MenuItem value="">Без флага</MenuItem>
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.emoji}>
                      <FlagOptionLabel flag={country.emoji} code={country.code} label={country.name} />
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.flag && <FormHelperText>{formErrors.flag}</FormHelperText>}
              </FormControl>
            </Stack>
            <FormControl fullWidth required>
              <InputLabel>Тип авторизации</InputLabel>
              <Select
                value={form.authType}
                label="Тип авторизации"
                onChange={(e) => updateField('authType', e.target.value as NodeAuthType)}
              >
                <MenuItem value="password">Логин и пароль</MenuItem>
                <MenuItem value="token">Токен</MenuItem>
              </Select>
            </FormControl>
            {form.authType === 'password' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Логин"
                  required
                  fullWidth
                  value={form.login || ''}
                  onChange={(e) => updateField('login', e.target.value)}
                  error={!!formErrors.login}
                  helperText={formErrors.login}
                />
                <TextField
                  label={editing ? 'Новый пароль' : 'Пароль'}
                  type="password"
                  required={!editing}
                  fullWidth
                  value={form.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  error={!!formErrors.password}
                  helperText={formErrors.password || (editing ? 'Оставьте пустым, чтобы не менять пароль' : undefined)}
                />
              </Stack>
            ) : (
              <TextField
                label={editing ? 'Новый токен' : 'Токен'}
                type="password"
                required={!editing}
                value={form.token || ''}
                onChange={(e) => updateField('token', e.target.value)}
                error={!!formErrors.token}
                helperText={formErrors.token || (editing ? 'Оставьте пустым, чтобы не менять токен' : undefined)}
              />
            )}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={!!form.isMain} onChange={(e) => updateField('isMain', e.target.checked)} />
              <Typography>Сделать основной нодой</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={checkFormConnection}>Проверить подключение</Button>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={saveNode}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Удалить ноду?</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить ноду {deleteTarget?.name}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={removeNode}>Удалить</Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
}
