import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Currency } from 'src/currencies/entities/currency.entity';

export class CurrenciesSeed implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    const currencyRepository = dataSource.getRepository(Currency);

    const currencies = [ 
      { id: 1, codigo: 'USD', simbolo: '$' },
      { id: 2, codigo: 'EUR', simbolo: '€' },
      { id: 3, codigo: 'GBP', simbolo: '£' },
      { id: 4, codigo: 'JPY', simbolo: '¥' },
      { id: 5, codigo: 'CNY', simbolo: '¥' },
      { id: 6, codigo: 'AUD', simbolo: 'A$' },
      { id: 7, codigo: 'CAD', simbolo: 'C$' },
      { id: 8, codigo: 'CHF', simbolo: 'CHF' },
      { id: 9, codigo: 'MXN', simbolo: '$' },
      { id: 10, codigo: 'BRL', simbolo: 'R$' },
      { id: 11, codigo: 'INR', simbolo: '₹' },
      { id: 12, codigo: 'RUB', simbolo: '₽' },
      { id: 12, codigo: 'UYU', simbolo: '$' },
    ];

    const existingCurrency = await currencyRepository.findOne({ where: { codigo: 'UYU' } });
    if (existingCurrency) {
      return;
    }

    await Promise.all(
      currencies.map(async (currency) => {
        await currencyRepository.upsert(currency, ['id']);
      })
    );
  }
}
