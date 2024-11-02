import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ChatGptThreadsService } from './chatGptThreads.service';

@Controller('/threads')
export class ChatGptThreadsController {
    constructor(
        private readonly chatGptThreadsService : ChatGptThreadsService
    ) {}

    @Post()
    handleCreateThreads(@Body() data) {
        return this.chatGptThreadsService.createThreads(data)
    }

    @Get(":numberPhone")
    handleGetThreads(@Param("numberPhone") numberPhone : number) {
        return this.chatGptThreadsService.getLastThreads(numberPhone)
    }

    @Delete(":threadId")
    handleDeleteThreads(@Param("threadId") threadId : string) {
        return this.chatGptThreadsService.deleteThread(threadId)
    }

    @Put(":threadId")
    handleUpdateThreadStatus(@Param("threadId") threadId : string) {
        return this.chatGptThreadsService.updateThreadStatus(threadId)
    }
    
}
