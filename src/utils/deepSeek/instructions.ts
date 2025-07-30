import { TIPO_SERVICIO_DELIVERY_ID } from 'src/database/seeders/app/tipopedido.seed';

export const SUPABASE_INSTRUCTIONS_FILE_PATH_DELIVERY =
  'https://fpswkddofgehbyiujiuo.supabase.co/storage/v1/object/public/WhatsProyImaages/Instructions/deepSeekInstructionsDelivery.txt';
export const SUPABASE_INSTRUCTIONS_FILE_PATH_RESERVA =
  'https://fpswkddofgehbyiujiuo.supabase.co/storage/v1/object/public/WhatsProyImaages/Instructions/deepSeekInstructionsReserva.txt';

export const SUPABASE_INSTRUCTIONS_FILE_PATH_RESERVA_ESPACIOS =
  'https://fpswkddofgehbyiujiuo.supabase.co/storage/v1/object/public/WhatsProyImaages/Instructions/deepSeekInstructionsReservaEspacios.txt'

export async function getInstructions(empresaType: any): Promise<string> {
  const isDelivery = empresaType === "DELIVERY"
  const isReserva = empresaType === 'RESERVA'
  
  try {
    const storageFIle =
      isDelivery
        ? SUPABASE_INSTRUCTIONS_FILE_PATH_DELIVERY
        :
        isReserva ?
          SUPABASE_INSTRUCTIONS_FILE_PATH_RESERVA
          : SUPABASE_INSTRUCTIONS_FILE_PATH_RESERVA_ESPACIOS;
    
          console.log("storageFIle", storageFIle)
    const res = await fetch(storageFIle);
    return await res.text();
  } catch (error) {
    return '';
  }
}
