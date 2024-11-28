import { Test, TestingModule } from '@nestjs/testing';
import { InfolineController } from './infoline.controller';
import { InfolineService } from './infoline.service';

describe('InfolineController', () => {
  let controller: InfolineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfolineController],
      providers: [InfolineService],
    }).compile();

    controller = module.get<InfolineController>(InfolineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
