import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

export type JobType = 'one-hour-before' | 'kickoff' | 'match-end-check' | 'live-tracking' | 'halftime' | 'goal' | 'result';

export type JobStatus = 'pending' | 'sent' | 'missed' | 'skipped';

export interface PersistedJob {
  id: string;
  matchId: number;
  type: JobType;
  scheduledAt: string;
  status: JobStatus;
  createdAt: string;
  sentAt?: string;
}

interface JobStoreData {
  jobs: PersistedJob[];
}

const DEFAULT_CLEANUP_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export class JobStore {
  private filePath: string;
  private data: JobStoreData;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.load();
  }

  private load(): JobStoreData {
    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, 'utf-8');
        return JSON.parse(content) as JobStoreData;
      }
    } catch (error) {
      console.error(`[jobStore] Error al cargar jobs desde ${this.filePath}:`, error);
    }
    return { jobs: [] };
  }

  private save(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[jobStore] Error al guardar jobs en ${this.filePath}:`, error);
    }
  }

  saveJob(job: PersistedJob): void {
    const existing = this.data.jobs.find((j) => j.id === job.id);
    if (existing) {
      Object.assign(existing, job);
    } else {
      this.data.jobs.push(job);
    }
    this.save();
  }

  markSent(jobId: string): void {
    const job = this.data.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'sent';
      job.sentAt = new Date().toISOString();
      this.save();
    }
  }

  markMissed(jobId: string): void {
    const job = this.data.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'missed';
      this.save();
    }
  }

  markSkipped(jobId: string): void {
    const job = this.data.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'skipped';
      this.save();
    }
  }

  getPendingJobs(): PersistedJob[] {
    return this.data.jobs.filter((j) => j.status === 'pending');
  }

  getMissedJobs(): PersistedJob[] {
    return this.data.jobs.filter((j) => j.status === 'missed');
  }

  getJobsByMatchId(matchId: number): PersistedJob[] {
    return this.data.jobs.filter((j) => j.matchId === matchId);
  }

  getJob(jobId: string): PersistedJob | undefined {
    return this.data.jobs.find((j) => j.id === jobId);
  }

  cleanup(olderThanMs: number = DEFAULT_CLEANUP_AGE_MS): number {
    const cutoff = Date.now() - olderThanMs;
    const before = this.data.jobs.length;
    this.data.jobs = this.data.jobs.filter((j) => {
      if (j.status === 'sent' || j.status === 'skipped') {
        const createdAt = new Date(j.createdAt).getTime();
        return createdAt > cutoff;
      }
      return true;
    });
    const removed = before - this.data.jobs.length;
    if (removed > 0) {
      this.save();
    }
    return removed;
  }
}
