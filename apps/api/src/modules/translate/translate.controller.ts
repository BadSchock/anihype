import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/roles.decorator';
import { TranslateDto } from './dto/translate.dto';
import { TranslateService } from './translate.service';

@ApiTags('Translate')
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Public()
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Traduz um texto para o idioma da interface' })
  translate(@Body() dto: TranslateDto) {
    return this.translateService.translate(dto.text, dto.targetLang ?? 'pt');
  }
}
