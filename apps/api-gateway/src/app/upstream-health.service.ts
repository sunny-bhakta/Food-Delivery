import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

export type ServiceStatus = 'up' | 'down';

interface ServiceTarget {
  name: string;
  baseUrl: string;
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: ServiceStatus;
  latencyMs?: number;
  error?: string;
  payload?: unknown;
}

export interface AggregateHealth {
  status: 'ok' | 'degraded';
  timestamp: string;
  latencyMs: number;
  services: ServiceHealth[];
}

@Injectable()
export class UpstreamHealthService {
  private readonly logger = new Logger(UpstreamHealthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async aggregate(): Promise<AggregateHealth> {
    const startedAt = Date.now();
    const services = await Promise.all(this.targets().map((target) => this.check(target)));

    const hasFailure = services.some((svc) => svc.status === 'down');
    return {
      status: hasFailure ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      services,
    };
  }

  private targets(): ServiceTarget[] {
    const entries: Array<[string, string | undefined]> = [
      ['catalog', this.configService.get<string>('services.catalog')],
      ['dispatch', this.configService.get<string>('services.dispatch')],
      ['notifications', this.configService.get<string>('services.notifications')],
      ['auth', this.configService.get<string>('services.auth')],
      ['payments', this.configService.get<string>('services.payments')],
    ];

    return entries
      .filter(([, url]) => Boolean(url))
      .map(([name, url]) => ({ name, baseUrl: url as string }));
  }

  private async check(target: ServiceTarget): Promise<ServiceHealth> {
    const startedAt = Date.now();
    const url = this.buildUrl(target.baseUrl, '/health');

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          timeout: 2_000,
        }),
      );

      return {
        name: target.name,
        url,
        status: 'up',
        latencyMs: Date.now() - startedAt,
        payload: response.data,
      };
    } catch (error: any) {
      this.logger.warn(`Health check failed for ${target.name}: ${error?.message ?? error}`);
      return {
        name: target.name,
        url,
        status: 'down',
        latencyMs: Date.now() - startedAt,
        error: error?.message ?? 'Unknown error',
      };
    }
  }

  private buildUrl(baseUrl: string, path: string): string {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBase}${path}`;
  }
}

