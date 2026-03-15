import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminAccessTokenGuard } from '../auth/guards';
import { ScraperReviewsService } from './scraper-reviews.service';
import { FilterReviewsDto } from './dto';
import { UpdateReviewDto } from './dto';
import { EditGroupModelDto } from './dto';
import { BatchApproveDto, BatchRejectDto } from './dto';

@UseGuards(AdminAccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Scraper Reviews')
@Controller('scraper/reviews')
export class ScraperReviewsController {
  constructor(private readonly service: ScraperReviewsService) {}

  @Get('grouped')
  @ApiOperation({ summary: 'Get reviews grouped by model slug' })
  findGrouped(@Query() filters: FilterReviewsDto) {
    return this.service.findGrouped(filters);
  }

  @Patch('group/:modelSlug/model')
  @ApiOperation({
    summary: 'Edit model data for all reviews in a model group',
  })
  @ApiParam({ name: 'modelSlug', description: 'Model slug (e.g. "pista-gp-rr")' })
  editGroupModel(
    @Param('modelSlug') modelSlug: string,
    @Body() dto: EditGroupModelDto,
  ) {
    return this.service.editGroupModel(modelSlug, dto.editedModelData);
  }

  @Post('group/:modelSlug/approve')
  @ApiOperation({ summary: 'Batch approve reviews in a model group' })
  @ApiParam({ name: 'modelSlug', description: 'Model slug' })
  batchApprove(
    @Param('modelSlug') modelSlug: string,
    @Body() dto: BatchApproveDto,
  ) {
    return this.service.batchApprove(modelSlug, dto);
  }

  @Post('group/:modelSlug/reject')
  @ApiOperation({ summary: 'Batch reject reviews in a model group' })
  @ApiParam({ name: 'modelSlug', description: 'Model slug' })
  batchReject(
    @Param('modelSlug') modelSlug: string,
    @Body() dto: BatchRejectDto,
  ) {
    return this.service.batchReject(modelSlug, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single review by ID' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a single review (model and/or variant data)' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a single review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  approveSingle(@Param('id') id: string) {
    return this.service.approveSingle(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a single review' })
  @ApiParam({ name: 'id', description: 'Review UUID' })
  rejectSingle(@Param('id') id: string) {
    return this.service.rejectSingle(id);
  }
}
