import { test, expect } from '@playwright/test';
import { JobStore, type PersistedJob } from '../src/jobStore';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(__dirname, 'test-data');

function getTestFile(testName: string): string {
  return join(TEST_DIR, `test-jobs-${testName}.json`);
}

function cleanup(filePath: string) {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

function createTestJob(overrides: Partial<PersistedJob> = {}): PersistedJob {
  return {
    id: 'test-job-1',
    matchId: 1001,
    type: 'one-hour-before',
    scheduledAt: new Date().toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

test.describe('JobStore', () => {
  test('saves and retrieves a job', () => {
    const testFile = getTestFile('save-retrieve');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    const job = createTestJob();
    store.saveJob(job);
    
    const retrieved = store.getJob('test-job-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-job-1');
    expect(retrieved?.matchId).toBe(1001);
    
    cleanup(testFile);
  });

  test('marks job as sent', () => {
    const testFile = getTestFile('mark-sent');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    const job = createTestJob();
    store.saveJob(job);
    
    store.markSent('test-job-1');
    
    const retrieved = store.getJob('test-job-1');
    expect(retrieved?.status).toBe('sent');
    expect(retrieved?.sentAt).toBeDefined();
    
    cleanup(testFile);
  });

  test('marks job as missed', () => {
    const testFile = getTestFile('mark-missed');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    const job = createTestJob();
    store.saveJob(job);
    
    store.markMissed('test-job-1');
    
    const retrieved = store.getJob('test-job-1');
    expect(retrieved?.status).toBe('missed');
    
    cleanup(testFile);
  });

  test('marks job as skipped', () => {
    const testFile = getTestFile('mark-skipped');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    const job = createTestJob();
    store.saveJob(job);
    
    store.markSkipped('test-job-1');
    
    const retrieved = store.getJob('test-job-1');
    expect(retrieved?.status).toBe('skipped');
    
    cleanup(testFile);
  });

  test('getPendingJobs returns only pending jobs', () => {
    const testFile = getTestFile('get-pending');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    store.saveJob(createTestJob({ id: 'job-1', status: 'pending' }));
    store.saveJob(createTestJob({ id: 'job-2', status: 'sent' }));
    store.saveJob(createTestJob({ id: 'job-3', status: 'missed' }));
    
    const pending = store.getPendingJobs();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('job-1');
    
    cleanup(testFile);
  });

  test('getMissedJobs returns only missed jobs', () => {
    const testFile = getTestFile('get-missed');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    store.saveJob(createTestJob({ id: 'job-1', status: 'pending' }));
    store.saveJob(createTestJob({ id: 'job-2', status: 'missed' }));
    
    const missed = store.getMissedJobs();
    expect(missed).toHaveLength(1);
    expect(missed[0].id).toBe('job-2');
    
    cleanup(testFile);
  });

  test('getJobsByMatchId returns jobs for a specific match', () => {
    const testFile = getTestFile('get-by-match');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    store.saveJob(createTestJob({ id: 'job-1', matchId: 1001 }));
    store.saveJob(createTestJob({ id: 'job-2', matchId: 1002 }));
    store.saveJob(createTestJob({ id: 'job-3', matchId: 1001 }));
    
    const jobs = store.getJobsByMatchId(1001);
    expect(jobs).toHaveLength(2);
    
    cleanup(testFile);
  });

  test('cleanup removes old sent jobs', async () => {
    const testFile = getTestFile('cleanup-old');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    const oldJob = createTestJob({ 
      id: 'old-job', 
      status: 'sent',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() 
    });
    const newJob = createTestJob({ 
      id: 'new-job', 
      status: 'sent',
      createdAt: new Date().toISOString() 
    });
    store.saveJob(oldJob);
    store.saveJob(newJob);
    
    const removed = store.cleanup(7 * 24 * 60 * 60 * 1000);
    expect(removed).toBe(1);
    expect(store.getJob('old-job')).toBeUndefined();
    expect(store.getJob('new-job')).toBeDefined();
    
    cleanup(testFile);
  });

  test('persists data to file', () => {
    const testFile = getTestFile('persist');
    cleanup(testFile);
    
    const store1 = new JobStore(testFile);
    store1.saveJob(createTestJob({ id: 'persist-test' }));
    
    const store2 = new JobStore(testFile);
    const job = store2.getJob('persist-test');
    expect(job).toBeDefined();
    expect(job?.id).toBe('persist-test');
    
    cleanup(testFile);
  });

  test('updates existing job on save', () => {
    const testFile = getTestFile('update');
    cleanup(testFile);
    
    const store = new JobStore(testFile);
    store.saveJob(createTestJob({ id: 'update-test', matchId: 1001 }));
    store.saveJob(createTestJob({ id: 'update-test', matchId: 9999 }));
    
    const job = store.getJob('update-test');
    expect(job?.matchId).toBe(9999);
    
    cleanup(testFile);
  });
});
