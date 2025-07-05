import { TIPO_SERVICIO_DELIVERY_ID } from 'src/database/seeders/app/tipopedido.seed';

export const SUPABASE_INSTRUCTIONS_FILE_PATH_DELIVERY =
  'https://fpswkddofgehbyiujiuo.supabase.co/storage/v1/object/public/WhatsProyImaages/Instructions/deepSeekInstructionsDelivery.txt';
export const SUPABASE_INSTRUCTIONS_FILE_PATH_RESERVA =
  'https://fpswkddofgehbyiujiuo.supabase.co/storage/v1/object/public/WhatsProyImaages/Instructions/deepSeekInstructionsReserva.txt';

  
export async function getInstructions(empresaType: any): Promise<string> {
  console.log("me llega", empresaType, TIPO_SERVICIO_DELIVERY_ID)
  const isDelivery = empresaType === "DELIVERY"
  try {
    const storageFIle =
      isDelivery
        ? SUPABASE_INSTRUCTIONS_FILE_PATH_DELIVERY
        : SUPABASE_INSTRUCTIONS_FILE_PATH_RESERVA;
    const res = await fetch(storageFIle);
    return await res.text();
  } catch (error) {
    return '';
  }
}
