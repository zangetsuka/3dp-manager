import { Box, LinearProgress, Chip, Stack, Typography } from '@mui/material';
import { useActiveJobs } from '../hooks/useActiveJobs';

const JOB_LABELS: Record<string, string> = {
  rotation: 'Ротация',
  relay_install: 'Установка relay',
  relay_delete: 'Удаление relay',
};

export function JobProgressBar() {
  const jobs = useActiveJobs();

  if (jobs.length === 0) return null;

  return (
    <Box sx={{ px: 2, py: 1 }}>
      {jobs.map((job) => (
        <Stack key={job.id} direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
          <Chip
            label={JOB_LABELS[job.type] || job.type}
            size="small"
            color={job.status === 'running' ? 'primary' : 'default'}
            variant="outlined"
          />
          <LinearProgress
            variant="determinate"
            value={job.progress}
            sx={{ flexGrow: 1, maxWidth: 300, height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
            {job.progress}%
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
