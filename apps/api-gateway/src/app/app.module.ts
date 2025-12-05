import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './configuration';
import { environmentValidationSchema } from './environment.validation';
import { HealthController } from './health.controller';
import { UpstreamHealthService } from './upstream-health.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
      validationSchema: environmentValidationSchema,
    }),
    HttpModule.register({
      timeout: 3_000,
      maxRedirects: 2,
    }),
  ],
  controllers: [HealthController],
  providers: [UpstreamHealthService],
})
export class AppModule {}
