import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';


@Controller('api/category')
export class CategoryController {
  constructor(
    private categoryService: CategoryService
  ) { }

  @Post()
  async createCategory(@Body() data: CreateCategoryDto) {
    return this.categoryService.createCategory(data)
  }

  @Get()
  async getAllCategories() {
    return this.categoryService.getAllCategories()
  }

  @Get(':idCategory/products')
  async getProductFromCategory(@Param('idCategory') idCategory: string) {
    return this.categoryService.getProductFromCategory(parseInt(idCategory))
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(parseInt(id))
  }

  @Patch(':id')
  async updateCategory(@Param('id') id: string, @Body() data: any) {
    return this.categoryService.update(parseInt(id), data)
  }
}
1