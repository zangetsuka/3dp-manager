import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Delete,
  Edit,
  ExpandMore,
  HelpOutline,
  Link as LinkIcon,
  MoreVert,
  OpenInNew,
  PauseCircleFilled,
  PlayCircleFilled,
  Refresh,
  Remove,
} from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { EnhancedDataGrid, type GridColDef } from '../components/EnhancedDataGrid';
import api from '../api';
import { copyToClipboard } from '../utils/copyToClipboard';
import { Logger } from '../utils/logger';
import type { NodeRecord } from '../types/node';
import { FlagOptionLabel } from '../utils/flags';
import { useToast } from '../components/ToastProvider';

interface Subscription {
  id: string;
  name: string;
  uuid: string;
  inbounds: unknown[];
  inboundsConfig?: InboundConfigUI[];
  isAutoRotationEnabled?: boolean;
  routingProfileId?: number;
  customerId?: number;
  groupId?: number;
  trafficLimit?: number;
  expiresAt?: string;
}

interface Tunnel {
  id: number;
  name: string;
  ip: string;
  domain: string;
  isInstalled: boolean;
  nodeId?: string;
}

interface InboundConfigUI {
  id: string;
  type: string;
  port: string;
  sni: string;
  link?: string;
  nodeId?: string;
  relayServerId?: string;
  flag?: string;
  name?: string;
  certificateFile?: string;
  keyFile?: string;
}

interface Domain {
  id: number;
  name: string;
}

interface CountryOption {
  name: string;
  code: string;
  emoji: string;
}

interface RoutingProfile {
  id: number;
  name: string;
  config: string;
}

interface CustomerRecord {
  id: number;
  name: string;
}

interface CustomerGroupRecord {
  id: number;
  name: string;
}

const CONNECTION_OPTIONS = [
  'vless-tcp-reality',
  'vless-xhttp-reality',
  'vless-grpc-reality',
  'vless-ws',
  'hysteria2-udp',
  'vmess-tcp',
  'shadowsocks-tcp',
  'trojan-tcp-reality',
  'custom',
];

const generateId = () => Math.random().toString(36).substring(7);

const getSubscriptionUrl = (uuid: string) => {
  const path = `/bus/${uuid}`;
  return typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [routingProfiles, setRoutingProfiles] = useState<RoutingProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroupRecord[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [inbounds, setInbounds] = useState<InboundConfigUI[]>([]);
  const [portErrors, setPortErrors] = useState<Record<string, string>>({});
  const [linksOpen, setLinksOpen] = useState(false);
  const [currentLinks, setCurrentLinks] = useState<string[]>([]);
  const [createdSubscriptionId, setCreatedSubscriptionId] = useState<string | null>(null);
  const [rotationLoading, setRotationLoading] = useState(false);
  const [rotationSettings, setRotationSettings] = useState({
    rotation_interval: '30',
    rotation_status: 'active',
    last_rotation_timestamp: '',
  });
  const [routingProfileId, setRoutingProfileId] = useState<number | ''>('');
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [trafficLimit, setTrafficLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const { showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    confirmText: 'Удалить',
    confirmColor: 'error' as 'error' | 'primary',
    onConfirm: () => {},
  });
  const initialLoadDone = useRef(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const openActionMenu = Boolean(menuAnchorEl);

  const loadSubs = useCallback(async () => {
    try {
      const [subsRes, tunnelsRes, nodesRes, domainsRes, countriesRes, settingsRes, routingRes, customersRes, groupsRes] =
        await Promise.all([
          api.get('/subscriptions'),
          api.get('/tunnels'),
          api.get<NodeRecord[]>('/nodes'),
          api.get('/domains/all'),
          api.get<CountryOption[]>('/settings/countries'),
          api.get('/settings'),
          api.get('/routing-profiles'),
          api.get('/customers'),
          api.get('/customer-groups'),
        ]);

      setSubs(Array.isArray(subsRes.data) ? subsRes.data : []);
      setTunnels(
        Array.isArray(tunnelsRes.data)
          ? tunnelsRes.data.filter((tunnel: Tunnel) => tunnel.isInstalled)
          : [],
      );
      setNodes(Array.isArray(nodesRes.data) ? nodesRes.data : []);
      setDomains(Array.isArray(domainsRes.data) ? domainsRes.data : []);
      setCountries(Array.isArray(countriesRes.data) ? countriesRes.data : []);
      setRoutingProfiles(Array.isArray(routingRes.data) ? routingRes.data : []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
      setCustomerGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setRotationSettings((prev) => ({ ...prev, ...settingsRes.data }));
    } catch (error) {
      Logger.error('Failed to load subscriptions data', 'Subs', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadSubs();
    }
  }, [loadSubs]);

  const getDefaultNodeId = () =>
    nodes.find((node) => node.isMain)?.id || nodes[0]?.id || '';

  const getNodeAddress = (nodeId?: string) => {
    const node = nodes.find((item) => item.id === (nodeId || getDefaultNodeId()));
    if (!node) return '';
    if (node.domain) return node.domain;
    if (node.ip) return node.ip;
    if (node.host) return node.host;
    try {
      return new URL(node.url).hostname;
    } catch {
      return node.url;
    }
  };

  const getHysteriaCertDefaults = (nodeId?: string) => {
    const address = getNodeAddress(nodeId);
    return {
      certificateFile: address ? `/root/cert/${address}/fullchain.pem` : '',
      keyFile: address ? `/root/cert/${address}/privkey.pem` : '',
    };
  };

  const getNodeFlag = (nodeId?: string) =>
    nodes.find((node) => node.id === (nodeId || getDefaultNodeId()))?.flag || '';

  const getRelayOptions = (nodeId?: string) =>
    tunnels.filter((tunnel) => tunnel.nodeId === (nodeId || getDefaultNodeId()));

  const isValidPort = (value: string) =>
    value === 'random' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 65535);

  const createInbound = (type = 'vless-tcp-reality'): InboundConfigUI => {
    const nodeId = getDefaultNodeId();
    const certDefaults = type === 'hysteria2-udp' ? getHysteriaCertDefaults(nodeId) : {};
    return {
        id: generateId(),
        type,
        port: 'random',
        sni: type === 'hysteria2-udp' ? '' : 'random',
        link: '',
        nodeId,
        flag: getNodeFlag(nodeId),
        name: '',
        ...certDefaults,
    };
  };

  const handleOpenCreate = () => {
    if (nodes.length === 0) {
      showToast('Создайте хотя бы одну ноду!', 'error');
      return;
    }
    if (domains.length === 0) {
      showToast('Создайте хотя бы один домен!', 'error');
      return;
    }

    setEditingId(null);
    setName('');
    setRoutingProfileId('');
    setCustomerId('');
    setGroupId('');
    setTrafficLimit('');
    setExpiresAt('');
    setInbounds([
      createInbound('hysteria2-udp'),
      createInbound('vless-xhttp-reality'),
      createInbound('vless-tcp-reality'),
      createInbound('vless-tcp-reality'),
      createInbound('vless-tcp-reality'),
      createInbound('vless-tcp-reality'),
      createInbound('vless-grpc-reality'),
      createInbound('vless-ws'),
      createInbound('vmess-tcp'),
      createInbound('shadowsocks-tcp'),
    ]);
    setPortErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setName(sub.name);
    setRoutingProfileId(sub.routingProfileId || '');
    setCustomerId(sub.customerId || '');
    setGroupId(sub.groupId || '');
    setTrafficLimit(sub.trafficLimit != null ? String(sub.trafficLimit) : '');
    setExpiresAt(sub.expiresAt || '');
    setInbounds(
      (sub.inboundsConfig?.length ? sub.inboundsConfig : [createInbound()]).map((item) => {
        const nodeId = item.nodeId || getDefaultNodeId();
        const certDefaults = getHysteriaCertDefaults(nodeId);
        return {
          id: generateId(),
          type: item.type || 'vless-tcp-reality',
          port: item.port ? item.port.toString() : 'random',
          sni: item.type === 'hysteria2-udp' ? '' : item.sni || 'random',
          link: item.link || '',
          nodeId,
          relayServerId: item.relayServerId ? item.relayServerId.toString() : '',
          flag: item.flag || getNodeFlag(nodeId),
          name: item.name || '',
          certificateFile:
            item.type === 'hysteria2-udp'
              ? item.certificateFile || certDefaults.certificateFile
              : undefined,
          keyFile:
            item.type === 'hysteria2-udp' ? item.keyFile || certDefaults.keyFile : undefined,
        };
      }),
    );
    setPortErrors({});
    setOpen(true);
  };

  const handleInboundChange = (id: string, field: keyof InboundConfigUI, value: string) => {
    setInbounds((prev) =>
      prev.map((inbound) => {
        if (inbound.id !== id) return inbound;
        const next = { ...inbound, [field]: value };

        if (field === 'nodeId') {
          next.relayServerId = '';
          next.flag = getNodeFlag(value);
          if (next.type === 'hysteria2-udp') {
            Object.assign(next, getHysteriaCertDefaults(value));
          }
        }

        if (field === 'type' && value === 'custom') {
          next.nodeId = '';
          next.relayServerId = '';
          next.flag = '';
          next.name = '';
          next.certificateFile = '';
          next.keyFile = '';
        }

        if (field === 'type' && value === 'hysteria2-udp') {
          next.sni = '';
          const defaults = getHysteriaCertDefaults(next.nodeId);
          next.certificateFile = next.certificateFile || defaults.certificateFile;
          next.keyFile = next.keyFile || defaults.keyFile;
        }

        if (field === 'type' && value !== 'custom' && !next.nodeId) {
          next.nodeId = getDefaultNodeId();
          next.flag = getNodeFlag(next.nodeId);
        }

        return next;
      }),
    );

    if (field === 'port') {
      setPortErrors((prev) => {
        const next = { ...prev };
        if (isValidPort(value)) delete next[id];
        else next[id] = 'Порт: число 1-65535 или random';
        return next;
      });
    }
  };

  const addInbound = () => {
    if (inbounds.length < 20) setInbounds((prev) => [...prev, createInbound()]);
  };

  const removeInbound = (id?: string) => {
    if (!id) {
      setInbounds([{ ...createInbound(), id: crypto.randomUUID() }]);
      setPortErrors({});
      return;
    }
    if (inbounds.length <= 1) return;
    setInbounds((prev) => prev.filter((inbound) => inbound.id !== id));
    setPortErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSave = async () => {
    const nextPortErrors = inbounds.reduce<Record<string, string>>((acc, inbound) => {
      if (inbound.type !== 'custom' && !isValidPort(inbound.port)) {
        acc[inbound.id] = 'Порт: число 1-65535 или random';
      }
      return acc;
    }, {});
    setPortErrors(nextPortErrors);

    if (Object.keys(nextPortErrors).length > 0) {
      showToast('Пожалуйста, исправьте ошибки с портами', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('Введите имя подписки', 'error');
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      routingProfileId: routingProfileId || undefined,
      customerId: customerId || undefined,
      groupId: groupId || undefined,
      trafficLimit: trafficLimit ? parseInt(trafficLimit, 10) : undefined,
      expiresAt: expiresAt || undefined,
      inboundsConfig: inbounds.map((inbound) => {
        if (inbound.type === 'custom') {
          return { type: inbound.type, link: inbound.link };
        }
        return {
          type: inbound.type,
          port: inbound.port === 'random' ? 'random' : parseInt(inbound.port, 10),
          sni: inbound.type === 'hysteria2-udp' ? undefined : inbound.sni,
          nodeId: inbound.nodeId || undefined,
          relayServerId: inbound.relayServerId
            ? parseInt(inbound.relayServerId, 10)
            : undefined,
          flag: inbound.flag || getNodeFlag(inbound.nodeId) || undefined,
          name: inbound.name?.trim() || undefined,
          certificateFile:
            inbound.type === 'hysteria2-udp'
              ? inbound.certificateFile?.trim() || undefined
              : undefined,
          keyFile:
            inbound.type === 'hysteria2-udp'
              ? inbound.keyFile?.trim() || undefined
              : undefined,
        };
      }),
    };

    try {
      if (editingId) {
        await api.put(`/subscriptions/${editingId}`, payload);
      } else {
        const res = await api.post<{ id?: string }>('/subscriptions', payload);
        setCreatedSubscriptionId(res.data?.id || null);
      }
      setOpen(false);
      loadSubs();
      showToast(editingId ? 'Подписка обновлена' : 'Подписка создана', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Произошла ошибка при сохранении';
      showToast(message, 'error');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Удалить подписку и все соединения?',
      confirmText: 'Удалить',
      confirmColor: 'error',
      onConfirm: async () => {
        await api.delete(`/subscriptions/${id}`);
        loadSubs();
        showToast('Подписка удалена', 'success');
      },
    });
  };

  const handleToggleAutoRotation = async (subscriptionId: string, enabled: boolean) => {
    try {
      await api.put('/subscriptions/bulk-auto-rotation', {
        subscriptionIds: [subscriptionId],
        enabled,
      });
      setSubs((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionId ? { ...sub, isAutoRotationEnabled: enabled } : sub,
        ),
      );
      showToast(enabled ? 'Авторотация включена' : 'Авторотация выключена', 'success');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ошибка обновления';
      showToast(message, 'error');
      loadSubs();
    }
  };

  const handleManualRotate = (sub: Subscription) => {
    setConfirmDialog({
      open: true,
      title: `Обновить подписку "${sub.name}" сейчас?`,
      confirmText: 'Обновить',
      confirmColor: 'primary',
      onConfirm: async () => {
        const res = await api.post(`/rotation/rotate-one/${sub.id}`);
        showToast(res.data?.message || 'Ротация выполнена', res.data?.success ? 'success' : 'error');
        loadSubs();
      },
    });
  };

  const saveRotationSettings = async (nextSettings = rotationSettings) => {
    await api.post('/settings', nextSettings);
    setRotationSettings(nextSettings);
  };

  const toggleRotationService = async () => {
    const nextStatus = rotationSettings.rotation_status === 'stopped' ? 'active' : 'stopped';
    const nextSettings = { ...rotationSettings, rotation_status: nextStatus };
    await saveRotationSettings(nextSettings);
    showToast(nextStatus === 'active' ? 'Ротация включена' : 'Ротация остановлена', 'success');
  };

  const saveRotationInterval = async () => {
    const interval = parseInt(rotationSettings.rotation_interval, 10);
    if (Number.isNaN(interval) || interval < 10) {
      showToast('Минимальный интервал ротации - 10 минут', 'error');
      return;
    }
    await saveRotationSettings(rotationSettings);
    showToast('Интервал ротации сохранен', 'success');
  };

  const rotateAllNow = () => {
    setConfirmDialog({
      open: true,
      title: 'Сгенерировать инбаунды сейчас для всех активных подписок?',
      confirmText: 'Сгенерировать',
      confirmColor: 'primary',
      onConfirm: async () => {
        try {
          setRotationLoading(true);
          const { data } = await api.post('/rotation/rotate-all');
          showToast(data?.message || 'Ротация завершена', data?.success ? 'success' : 'error');
          loadSubs();
        } finally {
          setRotationLoading(false);
        }
      },
    });
  };

  const formatRotationDate = (value: string) => {
    if (!value) return 'Нет данных';
    return new Date(Number(value)).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextRotationDate = () => {
    if (rotationSettings.rotation_status === 'stopped') return 'Пауза';
    if (!rotationSettings.last_rotation_timestamp) return 'Ожидание';
    const interval = parseInt(rotationSettings.rotation_interval, 10) || 30;
    return new Date(Number(rotationSettings.last_rotation_timestamp) + interval * 60000).toLocaleString(
      'ru-RU',
      { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    );
  };

  const showLinks = (sub: Subscription) => {
    const links = sub.inbounds?.map((item) => (item as { link?: string }).link).filter(Boolean) || [];
    setCurrentLinks(links.length ? links : ['Нет активных ссылок (ждите ротации)']);
    setLinksOpen(true);
  };

  const handleCopyLink = async (uuid: string) => {
    await copyToClipboard(getSubscriptionUrl(uuid));
    showToast('Ссылка на подписку скопирована', 'success');
  };

  const handleGenerateCreatedSubscription = async () => {
    if (!createdSubscriptionId) return;
    const res = await api.post(`/rotation/rotate-one/${createdSubscriptionId}`);
    showToast(res.data?.message || 'Ротация выполнена', res.data?.success ? 'success' : 'error');
    setCreatedSubscriptionId(null);
    loadSubs();
  };

  const openActionMenuFor = (event: React.MouseEvent<HTMLButtonElement>, sub: Subscription) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveSub(sub);
  };

  const closeActionMenu = () => {
    setMenuAnchorEl(null);
    setActiveSub(null);
  };

  const selectedRoutingProfile = routingProfiles.find((rp) => rp.id === routingProfileId);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Имя', width: 250,
      renderCell: (params) => <Typography fontWeight={700}>{params.row.name}</Typography>,
    },
    {
      field: 'uuid',
      headerName: 'UUID',
      width: 280,
      renderCell: (params) => <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{params.row.uuid}</Typography>,
    },
    {
      field: 'inboundCount',
      headerName: 'Инбаунды',
      width: 120,
      valueGetter: (_value, row) => row.inbounds?.length || 0,
    },
    {
      field: 'isAutoRotationEnabled',
      headerName: 'Авторотация',
      width: 130,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.isAutoRotationEnabled ?? true}
          onChange={(e) => handleToggleAutoRotation(params.row.id, e.target.checked)}
          color="primary"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: isMobile ? 60 : 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          {!isMobile && (
            <>
              <IconButton color="primary" onClick={() => handleCopyLink(params.row.uuid)} title="Копировать ссылку">
                <ContentCopy />
              </IconButton>
              <IconButton color="primary" onClick={() => window.open(getSubscriptionUrl(params.row.uuid), '_blank')} title="Открыть подписку">
                <OpenInNew />
              </IconButton>
            </>
          )}
          <IconButton onClick={(e) => openActionMenuFor(e, params.row)}><MoreVert /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>Подписки</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Создать
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Статус ротации</Typography>
            <Chip
              icon={rotationSettings.rotation_status === 'stopped' ? <PauseCircleFilled /> : <PlayCircleFilled />}
              label={rotationSettings.rotation_status === 'stopped' ? 'Остановлена' : 'Активна'}
              color={rotationSettings.rotation_status === 'stopped' ? 'warning' : 'success'}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
          <Tooltip title={rotationSettings.rotation_status === 'stopped' ? 'Возобновить ротацию' : 'Поставить на паузу'}>
            <IconButton onClick={toggleRotationService} size="small">
              {rotationSettings.rotation_status === 'stopped' ? <PlayCircleFilled fontSize="large" /> : <PauseCircleFilled fontSize="large" />}
            </IconButton>
          </Tooltip>
          <Divider flexItem orientation={isMobile ? 'horizontal' : 'vertical'} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Последняя генерация</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{formatRotationDate(rotationSettings.last_rotation_timestamp)}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Следующая генерация</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{getNextRotationDate()}</Typography>
          </Box>
          <TextField
            label="Интервал, мин"
            type="number"
            size="small"
            value={rotationSettings.rotation_interval}
            onChange={(e) => setRotationSettings((prev) => ({ ...prev, rotation_interval: e.target.value }))}
            sx={{ width: { xs: '100%', md: 150 } }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" onClick={saveRotationInterval}>Сохранить интервал</Button>
          <Button variant="contained" disabled={rotationLoading} onClick={rotateAllNow}>Обновить все</Button>
        </Stack>
      </Paper>

      <Box sx={{ height: 600, width: '100%' }}>
        <EnhancedDataGrid
          rows={subs}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </Box>

      <Menu anchorEl={menuAnchorEl} open={openActionMenu} onClose={closeActionMenu}>
        {isMobile && activeSub && <MenuItem onClick={() => handleCopyLink(activeSub.uuid)}><ListItemIcon><ContentCopy fontSize="small" color="primary" /></ListItemIcon><ListItemText>Копировать ссылку</ListItemText></MenuItem>}
        {isMobile && activeSub && <MenuItem onClick={() => window.open(getSubscriptionUrl(activeSub.uuid), '_blank')}><ListItemIcon><OpenInNew fontSize="small" color="primary" /></ListItemIcon><ListItemText>Открыть подписку</ListItemText></MenuItem>}
        {activeSub && <MenuItem onClick={() => showLinks(activeSub)}><ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon><ListItemText>Показать конфиги</ListItemText></MenuItem>}
        {activeSub && <MenuItem onClick={() => handleManualRotate(activeSub)}><ListItemIcon><Refresh fontSize="small" color="primary" /></ListItemIcon><ListItemText>Обновить сейчас</ListItemText></MenuItem>}
        {activeSub && <MenuItem onClick={() => handleOpenEdit(activeSub)}><ListItemIcon><Edit fontSize="small" /></ListItemIcon><ListItemText>Редактировать</ListItemText></MenuItem>}
        {activeSub && <MenuItem onClick={() => handleDelete(activeSub.id)}><ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon><ListItemText sx={{ color: 'error.main' }}>Удалить</ListItemText></MenuItem>}
      </Menu>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth disableRestoreFocus>
        <DialogTitle variant="h5">{editingId ? 'Редактировать подписку' : 'Новая подписка'}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '80vh' }}>
          {/* === General Section === */}
          <Accordion defaultExpanded elevation={0} sx={{ mb: 2, '&:before': { display: 'none' }, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Основное</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField autoFocus margin="dense" label="Имя подписки" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Клиент</InputLabel>
                  <Select value={customerId} label="Клиент" onChange={(e) => setCustomerId(e.target.value as number | '')}>
                    <MenuItem value="">Без клиента</MenuItem>
                    {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Группа клиентов</InputLabel>
                  <Select value={groupId} label="Группа клиентов" onChange={(e) => setGroupId(e.target.value as number | '')}>
                    <MenuItem value="">Без группы</MenuItem>
                    {customerGroups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField size="small" label="Лимит трафика (байт)" type="number" value={trafficLimit} onChange={(e) => setTrafficLimit(e.target.value)} fullWidth />
                <TextField size="small" label="Срок действия (ISO)" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} fullWidth placeholder="2026-12-31T23:59:59Z" />
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* === Routing Section === */}
          <Accordion defaultExpanded elevation={0} sx={{ mb: 2, '&:before': { display: 'none' }, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Routing</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Routing Profile</InputLabel>
                <Select value={routingProfileId} label="Routing Profile" onChange={(e) => setRoutingProfileId(e.target.value as number | '')}>
                  <MenuItem value="">Без маршрутизации</MenuItem>
                  {routingProfiles.map((rp) => <MenuItem key={rp.id} value={rp.id}>{rp.name}</MenuItem>)}
                </Select>
              </FormControl>
              {selectedRoutingProfile && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={selectedRoutingProfile.config || ''}
                  slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.75rem' } } }}
                  label="Предпросмотр конфига"
                />
              )}
            </AccordionDetails>
          </Accordion>

          {/* === Connections Section === */}
          <Accordion defaultExpanded elevation={0} sx={{ '&:before': { display: 'none' }, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Подключения ({inbounds.length}/20)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2} sx={{ maxHeight: '50vh', overflow: 'auto', pr: 1 }}>
                {inbounds.map((inbound, index) => (
                  <Paper
                    key={inbound.id}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 'bold', mr: 1 }}>#{index + 1}</Typography>
                      <FormControl size="small" sx={{ flexGrow: 1 }}>
                        <InputLabel>Тип</InputLabel>
                        <Select value={inbound.type} label="Тип" onChange={(e) => handleInboundChange(inbound.id, 'type', e.target.value)}>
                          {CONNECTION_OPTIONS.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <IconButton color="primary" onClick={() => removeInbound(inbound.id)} disabled={inbounds.length <= 1} size="small">
                        <Delete />
                      </IconButton>
                    </Box>

                    {inbound.type === 'custom' ? (
                      <TextField size="small" label="Ссылка на подключение" placeholder="vless://..." value={inbound.link || ''} onChange={(e) => handleInboundChange(inbound.id, 'link', e.target.value)} fullWidth />
                    ) : (
                      <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                          <FormControl size="small">
                            <InputLabel>Нода</InputLabel>
                            <Select value={inbound.nodeId || ''} label="Нода" onChange={(e) => handleInboundChange(inbound.id, 'nodeId', e.target.value)}>
                              <MenuItem value="">Основная нода</MenuItem>
                              {nodes.map((node) => <MenuItem key={node.id} value={node.id}>{node.name}{node.isMain ? ' (основная)' : ''}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <TextField size="small" label="Порт" placeholder="random или порт" value={inbound.port} onChange={(e) => handleInboundChange(inbound.id, 'port', e.target.value)} error={!!portErrors[inbound.id]} helperText={portErrors[inbound.id] || ' '} />
                          <FormControl size="small">
                            <InputLabel>SNI</InputLabel>
                            <Select value={inbound.sni} label="SNI" onChange={(e) => handleInboundChange(inbound.id, 'sni', e.target.value)}>
                              <MenuItem value="random">random</MenuItem>
                              {domains.map((domain) => <MenuItem key={domain.id} value={domain.name}>{domain.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <FormControl size="small">
                            <InputLabel>Флаг</InputLabel>
                            <Select value={inbound.flag || getNodeFlag(inbound.nodeId)} label="Флаг" onChange={(e) => handleInboundChange(inbound.id, 'flag', e.target.value)} renderValue={(value) => <FlagOptionLabel flag={value} label={countries.find((country) => country.emoji === value)?.name || 'Флаг'} />}>
                              <MenuItem value="">Без флага</MenuItem>
                              {countries.map((country) => <MenuItem key={country.code} value={country.emoji}><FlagOptionLabel flag={country.emoji} code={country.code} label={country.name} /></MenuItem>)}
                            </Select>
                          </FormControl>
                          <TextField size="small" label="Название" value={inbound.name || ''} onChange={(e) => handleInboundChange(inbound.id, 'name', e.target.value)} />
                          <FormControl size="small">
                            <InputLabel>Relay</InputLabel>
                            <Select value={inbound.relayServerId || ''} label="Relay" onChange={(e) => handleInboundChange(inbound.id, 'relayServerId', e.target.value)}>
                              <MenuItem value="">Без relay</MenuItem>
                              {getRelayOptions(inbound.nodeId).map((tunnel) => <MenuItem key={tunnel.id} value={tunnel.id.toString()}>{tunnel.name}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Box>

                        {inbound.type === 'hysteria2-udp' && (
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1.5 }}>
                            <TextField
                              size="small"
                              label="Сертификат"
                              value={inbound.certificateFile || ''}
                              onChange={(e) => handleInboundChange(inbound.id, 'certificateFile', e.target.value)}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Tooltip title="Путь к сертификату должен существовать на выбранной ноде. По умолчанию используется путь Let's Encrypt.">
                                      <HelpOutline fontSize="small" color="action" />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <TextField
                              size="small"
                              label="Приватный ключ"
                              value={inbound.keyFile || ''}
                              onChange={(e) => handleInboundChange(inbound.id, 'keyFile', e.target.value)}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Tooltip title="Путь к приватному ключу должен существовать на выбранной ноде. По умолчанию используется путь Let's Encrypt.">
                                      <HelpOutline fontSize="small" color="action" />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Box>
                        )}
                      </>
                    )}
                  </Paper>
                ))}
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" size="small" startIcon={<Add />} onClick={addInbound} disabled={inbounds.length >= 20}>Добавить подключение</Button>
                <Button variant="outlined" color="error" size="small" startIcon={<Remove />} sx={{ ml: 1 }} onClick={() => removeInbound()}>Удалить все</Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={linksOpen} onClose={() => setLinksOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Активные ссылки</DialogTitle>
        <DialogContent>
          <TextField multiline fullWidth rows={10} value={currentLinks.join('\n\n')} slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => copyToClipboard(currentLinks.join('\n'))}>Копировать все</Button>
          <Button onClick={() => setLinksOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent><Typography>{confirmDialog.title}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Отмена</Button>
          <Button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, open: false }); }} variant="contained" color={confirmDialog.confirmColor}>
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createdSubscriptionId !== null} onClose={() => setCreatedSubscriptionId(null)}>
        <DialogTitle>Подписка создана</DialogTitle>
        <DialogContent><Typography>Сгенерировать подключения сейчас?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatedSubscriptionId(null)}>Нет</Button>
          <Button onClick={handleGenerateCreatedSubscription} variant="contained">Да</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
