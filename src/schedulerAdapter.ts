import schedule from 'node-schedule';
import type { ScheduleJob, SchedulerAdapter } from './types';

export class NodeScheduleAdapter implements SchedulerAdapter {
  scheduleAt(date: Date, taskName: string, handler: () => Promise<void>): ScheduleJob {
    const job = schedule.scheduleJob(date, async () => {
      try {
        await handler();
      } catch (error) {
        console.error(`[scheduler] Error en tarea "${taskName}":`, error);
      }
    });

    if (!job) {
      throw new Error(`No se pudo programar la tarea "${taskName}" para ${date.toISOString()}`);
    }

    console.log(`[scheduler] Tarea "${taskName}" programada para ${date.toISOString()}`);

    return {
      cancel: () => {
        job.cancel();
        console.log(`[scheduler] Tarea "${taskName}" cancelada`);
      },
    };
  }
}

export class InMemorySchedulerAdapter implements SchedulerAdapter {
  readonly scheduledTasks: Array<{
    date: Date;
    taskName: string;
    handler: () => Promise<void>;
    cancelled: boolean;
  }> = [];

  scheduleAt(date: Date, taskName: string, handler: () => Promise<void>): ScheduleJob {
    const task = { date, taskName, handler, cancelled: false };
    this.scheduledTasks.push(task);

    return {
      cancel: () => {
        task.cancelled = true;
      },
    };
  }

  async runTask(taskName: string): Promise<void> {
    const task = this.scheduledTasks.find((item) => item.taskName === taskName && !item.cancelled);
    if (!task) {
      throw new Error(`Tarea no encontrada: ${taskName}`);
    }
    await task.handler();
  }
}
