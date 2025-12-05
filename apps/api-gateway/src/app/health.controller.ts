import { Controller, Get } from '@nestjs/common';
import { UpstreamHealthService } from './upstream-health.service';

@Controller()
export class HealthController {
  constructor(private readonly upstreamHealthService: UpstreamHealthService) {}

  @Get('health')
  async health() {
    return this.upstreamHealthService.aggregate();
  }
}

