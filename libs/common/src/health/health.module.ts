import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
