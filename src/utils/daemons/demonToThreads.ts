import { handleGetCurrentConnection } from 'src/utils/dbConnection';
import * as moment from 'moment-timezone';
import { ChatGptThreads } from 'src/chatGptThreads/entities/chatGpThreads.entity';

export const DemonDeleteOldsThreads = async () => {
  console.log('Ejecuto daemon delete old threads');
  const connection = await handleGetCurrentConnection();

  try {
    const repoThread = connection.getRepository(ChatGptThreads);

    const fifteenMinutesAgo = moment.utc().subtract(15, 'minutes').toDate();

    const oldThreads = await repoThread.find({
      where: {
        last_update: { $lte: fifteenMinutesAgo } as any,
      },
    });

    if (oldThreads.length > 0) {
      await repoThread.remove(oldThreads);
      console.log(`🧹 Se eliminaron ${oldThreads.length} threads viejos.`);
    } else {
      console.log('✅ No hay threads viejos para eliminar.');
    }
  } catch (error) {
    console.error('❌ Error en DemonDeleteOldsThreads:', error);
  } finally {
    await connection.destroy();
  }
};
