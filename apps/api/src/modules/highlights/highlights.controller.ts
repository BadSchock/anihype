import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../../common/decorators';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto, UpdateHighlightDto } from './dto/highlight.dto';

@ApiTags('Highlights')
@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Public()
  @Get('hero')
  @ApiOperation({ summary: 'Destaque ativo para o hero da home' })
  getHero() {
    return this.highlightsService.getHeroHighlight();
  }

  @Get()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar destaques (admin)' })
  findAll() {
    return this.highlightsService.findAll();
  }

  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar destaque da temporada (admin)' })
  create(@Body() dto: CreateHighlightDto) {
    return this.highlightsService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar destaque (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHighlightDto) {
    return this.highlightsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover destaque (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.highlightsService.remove(id);
  }
}
