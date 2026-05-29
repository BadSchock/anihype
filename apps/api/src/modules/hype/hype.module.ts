import { Global, Module } from '@nestjs/common';
import { HypeController } from './hype.controller';
import { HypeService } from './hype.service';

@Global()
@Module({
  controllers: [HypeController],
  providers: [HypeService],
  exports: [HypeService],
})
export class HypeModule {}
