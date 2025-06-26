import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { Category } from 'src/category/entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OpenaiService {
    private openai;

    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>
    ) {
        this.openai = new OpenAI({
            apiKey: process.env.OPEN_AI_TOKEN,
        });
    }

    async parseMenu(text: string): Promise<any> {
        try {
            const allCategories = await this.categoryRepo.find({ where: { enabled: true } })

            let categoryText = "";

            allCategories.map((cat) => {
                categoryText += `\nid: ${cat.id}, nombre: ${cat.name}, descripcion: ${cat.description}\n`
            })


            const prompt = `
                Tu tarea es analizar el siguiente texto extraído de una imagen de un menú de restaurante y devolver un arreglo en formato JSON. 
                Cada objeto del arreglo representa un producto del menú. Seguí estrictamente este esquema por cada producto:

                {
                "nombre": string (por defecto: ""),
                "precio": number (por defecto: 0),
                "descripcion": string (por defecto: ""),
                "plazoDuracionEstimadoMinutos": number (por defecto: 20),
                "disponible": boolean (por defecto: true),
                "isMenuDiario": boolean (por defecto: false),
                "imagen": string (por defecto: ""),
                "currency_id": number (por defecto: 1),
                "diaSemana": number (por defecto: 0),
                "orderMenuDiario": boolean (por defecto: false),
                "categoryIds": array de números con los ID de las categorías que correspondan (ver más abajo)
                }

                A continuación te paso las categorías disponibles. Usá el campo "descripcion" y "nombre" para relacionar el producto con la categoría más adecuada y asigná su "id" en "categoryIds":

                ${categoryText}

                Ahora analizá este texto del menú y devolvé los productos según el formato mencionado:

                "${text}"

                Respondé solo con el JSON válido. No incluyas explicaciones ni texto adicional.
                `;

            const response = await this.openai.createChatCompletion({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
            });

            const result = response.data.choices[0].message?.content;
            return {
                ok: true,
                data: JSON.parse(result || '{}')
            }

        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al obtener los numeros',
                error: 'Bad Request',
            });
        }

    }
}
