import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ReturnDocument } from 'typeorm'
import { Category } from './entities/category.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Producto)
    private readonly productRepository: Repository<Producto>
  ) { }

  async createCategory(data: CreateCategoryDto) {
    try {
      const existCategoryWithName = await this.categoryRepository.findOne({ where: { name: data.name } })

      if (existCategoryWithName) {
        throw new BadRequestException("")
      }

      const newCategory = this.categoryRepository.create({
        name: data.name,
        description: data.description,
        image: data.image,
        enabled: true,
      })

      await this.categoryRepository.save(newCategory)

      return {
        ok: true,
        message: "Category created successfully",
        data: newCategory
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async getAllCategories() {
    try {
      const allCategories = await this.categoryRepository.find({ where: { enabled: true }, relations: ['producto'] })

      return {
        ok: true,
        data: allCategories.map((cat) => {
          return {
            ...cat,
            productosCount: cat?.producto?.length,
          }
        })
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async getProductFromCategory(idCategory: number) {
    try {

      const categoryExist = await this.categoryRepository.findOne({
        where: { id: idCategory }, relations: ['producto'],
      });

      if (!categoryExist) {
        throw new BadRequestException("No category could be found with that id");
      }

      const productsWithCategories = categoryExist.producto.map(product => {
        return {
          ...product,
          category: product.category,
        };
      });

      return {
        ok: true,
        data: productsWithCategories,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }


  async deleteCategory(idCategory: number) {
    try {
      const categoryExist = await this.categoryRepository.findOne({ where: { id: idCategory }, relations: ['producto', 'producto.category', 'producto.category.producto'] })

      if (!categoryExist) {
        throw new BadRequestException("No category could be found with that id")
      }

      if (categoryExist.producto.length > 0) {
        Promise.all(
          categoryExist.producto.map(async (prod) => {
            prod.category = prod.category.filter((cat) => cat.id !== categoryExist.id)
            await this.productRepository.save(prod)
          })

        )
      }

      await this.categoryRepository.delete(categoryExist.id)

      return {
        ok: true,
        message: "Category delete successfully"
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async update(id: number, updateDto: any) {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });

      if (!category) {
        throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
      }

      const updated = Object.assign(category, updateDto);

      await this.categoryRepository.save(updated);

      return {
        ok: true,
        data: updated
      }

    } catch (error) {
      console.log(error);
    }
  }

}
