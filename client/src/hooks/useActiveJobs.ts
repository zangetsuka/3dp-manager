import { useState, useEffect, useCallback } from 'react';
import api from '../api';

interface Job {
  id: number;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export function useActiveJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const poll = useCallback(async () => {
    try {
      const { data } = await api.get<{ items: Job[] }>('/api/jobs?limit=20');
      const active = (data.items || []).filter(
        (j) => j.status === 'running' || j.status === 'pending',
      );
      setJobs(active);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll]);

  return jobs;
}
