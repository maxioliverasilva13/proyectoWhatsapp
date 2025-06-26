import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/category/entities/category.entity';
import { Repository } from 'typeorm';
import axios from 'axios';

@Injectable()
export class OpenaiService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) { }

    async parseMenu(text: string): Promise<any> {
        try {
            const allCategories = await this.categoryRepo.find({ where: { enabled: true } });

            let categoryText = '';
            allCategories.map((cat) => {
                categoryText += `\nid: ${cat.id}, nombre: ${cat.name}, descripcion: ${cat.description}\n`;
            });

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

            const response = await axios.post(
                'https://api.deepseek.com/v1/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.DEEPSEEK_TOKEN}`,
                    },
                },
            );

            const result = response.data.choices[0].message?.content;
            return {
                ok: true,
                data: JSON.parse(result || '{}'),
            };
        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al procesar el menú',
                error: 'Bad Request',
            });
        }
    }
}
