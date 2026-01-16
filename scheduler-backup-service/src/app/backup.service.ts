import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec, spawn } from 'child_process';
import { lookup } from 'dns/promises';
import { mkdir, writeFile } from 'fs/promises';
import { basename, dirname, join, resolve } from 'path';
import type { BackupArtifact, BackupResult } from './backup.types';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private running = false;
  private lastResult: BackupResult | null = null;

  @Cron(process.env.BACKUP_CRON ?? '0 2 * * *')
  async scheduledBackup() {
    if (process.env.BACKUP_ENABLED === 'false') return;
    await this.runBackup('scheduled');
  }

  getLastResult() {
    return this.lastResult;
  }

  async runBackup(reason = 'manual'): Promise<BackupResult> {
    if (this.running) {
      const now = new Date().toISOString();
      return {
        ok: false,
        startedAt: now,
        finishedAt: now,
        artifacts: [],
        message: 'Backup already running',
      };
    }

    this.running = true;
    const startedAt = new Date();
    const artifacts: BackupArtifact[] = [];

    try {
      const dir = await this.prepareDirectory(startedAt);

      if (process.env.BACKUP_PG_ENABLED !== 'false') {
        const pgFile = join(dir, `postgres-${this.safeTimestamp(startedAt)}.dump`);
        await this.runPgDump(pgFile);
        artifacts.push({ name: 'postgres', path: pgFile });
      }

      if (process.env.BACKUP_MONGO_ENABLED !== 'false') {
        const mongoFile = join(dir, `mongo-${this.safeTimestamp(startedAt)}.archive.gz`);
        await this.runMongoDump(mongoFile);
        artifacts.push({ name: 'mongo', path: mongoFile });
      }

      if (process.env.BACKUP_SUPABASE_ENABLED !== 'false') {
        const supabaseFile = join(dir, `supabase-${this.safeTimestamp(startedAt)}.dump`);
        await this.runSupabaseDump(supabaseFile);
        artifacts.push({ name: 'supabase', path: supabaseFile });
      }

      await this.writeManifest(dir, artifacts, reason);
      await this.runRemoteUpload(dir, artifacts);

      const result = this.finishResult(true, startedAt, artifacts);
      this.lastResult = result;
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const result = this.finishResult(false, startedAt, artifacts, message);
      this.lastResult = result;
      return result;
    } finally {
      this.running = false;
    }
  }

  private async prepareDirectory(startedAt: Date): Promise<string> {
    const baseDir = process.env.BACKUP_DIR ?? 'backups';
    const dir = join(baseDir, this.safeTimestamp(startedAt));
    await mkdir(dir, { recursive: true });
    return dir;
  }

  private async runPgDump(outputFile: string): Promise<void> {
    const pgUri =
      process.env.PG_URI ||
      `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;
    if (process.env.BACKUP_USE_DOCKER === 'true') {
      await this.runPgDumpDocker(outputFile, pgUri);
      return;
    }
    const cmd = process.env.BACKUP_PG_DUMP_CMD ?? 'pg_dump';
    await this.runCommand(cmd, ['--format=custom', '--file', outputFile, pgUri]);
  }

  private async runMongoDump(outputFile: string): Promise<void> {
    const mongoUri = process.env.MONGO_URI || process.env.DASHBOARD_MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not configured');
    }
    if (process.env.BACKUP_USE_DOCKER === 'true') {
      await this.runMongoDumpDocker(outputFile, mongoUri);
      return;
    }
    const cmd = process.env.BACKUP_MONGO_DUMP_CMD ?? 'mongodump';
    await this.runCommand(cmd, ['--uri', mongoUri, `--archive=${outputFile}`, '--gzip']);
  }

  private async runSupabaseDump(outputFile: string): Promise<void> {
    const supabaseUri = process.env.SUPABASE_PG_URI;
    if (!supabaseUri) {
      throw new Error('SUPABASE_PG_URI not configured');
    }
    if (process.env.BACKUP_USE_DOCKER === 'true') {
      await this.runSupabaseDumpDocker(outputFile, supabaseUri);
      return;
    }
    const cmd = process.env.BACKUP_SUPABASE_DUMP_CMD ?? 'pg_dump';
    await this.runCommand(cmd, ['--format=custom', '--file', outputFile, supabaseUri]);
  }

  private async runPgDumpDocker(outputFile: string, pgUri: string): Promise<void> {
    const container = process.env.BACKUP_PG_CONTAINER ?? 'dvs-postgres';
    const filename = basename(outputFile);
    const tmpPath = `/tmp/${filename}`;
    const dockerUri =
      process.env.BACKUP_PG_DOCKER_URI ||
      (process.env.PG_USER && process.env.PG_PASSWORD && process.env.PG_DATABASE
        ? `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@localhost:5432/${process.env.PG_DATABASE}`
        : pgUri);
    await this.runCommand('docker', [
      'exec',
      container,
      'pg_dump',
      '--format=custom',
      '--file',
      tmpPath,
      dockerUri,
    ]);
    await this.runCommand('docker', ['cp', `${container}:${tmpPath}`, outputFile]);
    await this.runCommand('docker', ['exec', container, 'rm', '-f', tmpPath]);
  }

  private async runMongoDumpDocker(outputFile: string, mongoUri: string): Promise<void> {
    const container = process.env.BACKUP_MONGO_CONTAINER ?? 'dvs-mongo';
    const filename = basename(outputFile);
    const tmpPath = `/tmp/${filename}`;
    await this.runCommand('docker', [
      'exec',
      container,
      'mongodump',
      '--uri',
      mongoUri,
      `--archive=${tmpPath}`,
      '--gzip',
    ]);
    await this.runCommand('docker', ['cp', `${container}:${tmpPath}`, outputFile]);
    await this.runCommand('docker', ['exec', container, 'rm', '-f', tmpPath]);
  }

  private async runSupabaseDumpDocker(outputFile: string, supabaseUri: string): Promise<void> {
    const dir = resolve(dirname(outputFile));
    const filename = basename(outputFile);
    const dnsList = (process.env.BACKUP_SUPABASE_DNS || '').split(',').map((item) => item.trim()).filter(Boolean);
    const args = ['run', '--rm', '-v', `${dir}:/backup`];
    for (const dns of dnsList) {
      args.push('--dns', dns);
    }
    if (process.env.BACKUP_SUPABASE_FORCE_IPV4 === 'true') {
      const host = new URL(supabaseUri).hostname;
      const overrideIp = process.env.BACKUP_SUPABASE_HOST_IP;
      const address = overrideIp || (await lookup(host, { family: 4 })).address;
      args.push('--add-host', `${host}:${address}`);
    }
    args.push(
      'postgres:16',
      'pg_dump',
      '--format=custom',
      '--file',
      `/backup/${filename}`,
      supabaseUri,
    );
    await this.runCommand('docker', args);
  }

  private async writeManifest(dir: string, artifacts: BackupArtifact[], reason: string) {
    const manifest = {
      generatedAt: new Date().toISOString(),
      reason,
      artifacts,
    };
    await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }

  private async runRemoteUpload(dir: string, artifacts: BackupArtifact[]) {
    const commandTemplate = process.env.BACKUP_REMOTE_COMMAND;
    if (!commandTemplate) return;

    for (const artifact of artifacts) {
      const filePath = artifact.path;
      const command = commandTemplate
        .replace(/\{file\}/g, filePath)
        .replace(/\$BACKUP_FILE/g, filePath);

      await new Promise<void>((resolve, reject) => {
        exec(
          command,
          {
            env: {
              ...process.env,
              BACKUP_DIR: dir,
              BACKUP_FILE: filePath,
            },
          },
          (error) => {
            if (error) {
              this.logger.warn(`Remote upload failed: ${error.message}`);
              reject(error);
              return;
            }
            resolve();
          },
        );
      });
    }
  }

  private runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit', shell: true });
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
        }
      });
    });
  }

  private finishResult(
    ok: boolean,
    startedAt: Date,
    artifacts: BackupArtifact[],
    message?: string,
  ): BackupResult {
    return {
      ok,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      artifacts,
      message,
    };
  }

  private safeTimestamp(value: Date): string {
    return value.toISOString().replace(/[:.]/g, '-');
  }
}
