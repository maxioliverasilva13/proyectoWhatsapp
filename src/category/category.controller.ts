import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  async createCategory(@Body() data : CreateCategoryDto) {
    return this.categoryService.createCategory(data)
  }

  @Get()
  async getAllCategories() {
    return this.categoryService.getAllCategories()
  }

  @Get(':id/products')
  async getProductFromCategory(@Param() id : string) {
    return this.categoryService.getProductFromCategory(parseInt(id))
  }

  @Delete(':id')
  async deleteCategory(@Param() id : string) {
    return this.categoryService.deleteCategory(parseInt(id))
  }

}
