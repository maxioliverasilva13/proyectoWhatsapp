import { Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/suprabase/suprabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const supabase = this.supabaseService.getClient();
    console.log('el client es:', supabase);
    
    const bucket = process.env.SUPABASE_BUCKET;
    const sanitizedFileName = file.originalname
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_");

    const fileName = `${uuidv4()}-${sanitizedFileName}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    
    return publicUrlData.publicUrl;
  }
}
