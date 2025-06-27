import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/category/entities/category.entity';
import { Repository } from 'typeorm';
import OpenAI from 'openai';


@Injectable()
export class OpenaiService {
    private openai: OpenAI;

    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) {
        this.openai = new OpenAI({
            apiKey: process.env.OPEN_AI_TOKEN,
        });
    }

    async parseMenu(imageUrl: string): Promise<any> {
        try {
            console.log('📥 URL de la imagen:', imageUrl);

            const allCategories = await this.categoryRepo.find({ where: { enabled: true } });
            console.log('📦 Categorías habilitadas:', allCategories.length);

            let categoryText = '';
            allCategories.forEach((cat) => {
                categoryText += `\nid: ${cat.id}, nombre: ${cat.name}, descripcion: ${cat.description}\n`;
            });

            const prompt = `
Vas a analizar una imagen de un menú de restaurante y extraer un arreglo JSON con todos los productos que puedas identificar.  
Cada producto debe seguir estrictamente este esquema (campos por defecto si no se detectan):

object_prod : {
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
  "categoryIds": array de números con los ID de las categorías que correspondan (usa "descripcion" y "nombre" para relacionar), o null si no sabes.
}

estrcutura de respuesta : 
object_prod[]

un array de object_prod, no debes de saltearte ninguno, responde con todos.
Si no puedes identificar un producto o no está claro, simplemente **omite ese producto**.  
Devuelve solo el JSON válido, que sea un arreglo con los productos detectados.  
No agregues texto adicional, ni explicaciones.

Categorías disponibles para usar (usa "descripcion" y "nombre" para asignar "categoryIds"):

${categoryText}
`;

            const messages = [
                { role: 'system', content: 'Instrucciones del sistema' },
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: imageUrl } },
                        { type: 'text', text: prompt }
                    ]
                }
            ] as { role: 'system' | 'user' | 'assistant'; content: string }[];

            const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0,
    });

    let result = response.choices[0].message?.content?.trim();

    console.log('🧠 Respuesta de OpenAI:', result);

    if (!result) throw new Error('Respuesta vacía de OpenAI');

    // Asegurarse que empieza con [ para ser array JSON
    if (!result.startsWith('[')) {
      // Intentar extraer solo el JSON array de la respuesta (por si viene con texto)
      const jsonStart = result.indexOf('[');
      const jsonEnd = result.lastIndexOf(']');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        result = result.substring(jsonStart, jsonEnd + 1);
      } else {
        throw new Error('No se encontró un array JSON válido en la respuesta');
      }
    }

    const parsed = JSON.parse(result);

    if (!Array.isArray(parsed)) throw new Error('La respuesta JSON no es un array');

    return {
      ok: true,
      data: parsed,
    };
    } catch(error) {
        console.error('❌ Error al procesar el menú:', error.message);
        throw new BadRequestException({
            ok: false,
            statusCode: 400,
            message: error.message || 'Error al procesar el menú',
            error: 'Bad Request',
        });
    }
}

}

