import { Test, TestingModule } from '@nestjs/testing';
import { TenantConnectionServiceService } from './tenant-connection-service.service';

describe('TenantConnectionServiceService', () => {
  let service: TenantConnectionServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantConnectionServiceService],
    }).compile();

    service = module.get<TenantConnectionServiceService>(TenantConnectionServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
