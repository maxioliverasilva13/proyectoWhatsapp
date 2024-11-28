import { Test, TestingModule } from '@nestjs/testing';
import { InfolineService } from './infoline.service';

describe('InfolineService', () => {
  let service: InfolineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfolineService],
    }).compile();

    service = module.get<InfolineService>(InfolineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
