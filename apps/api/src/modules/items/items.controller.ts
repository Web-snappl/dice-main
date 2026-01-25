import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ItemsService } from './items.service';
import { Item } from './item.schema';

@Controller('items')
export class ItemsController {
    constructor(private readonly itemsService: ItemsService) { }

    @Get()
    async findAll(): Promise<Item[]> {
        return this.itemsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Item> {
        return this.itemsService.findOne(id);
    }

    @Post()
    async create(@Body() item: Item): Promise<Item> {
        return this.itemsService.create(item);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() item: Item): Promise<Item> {
        return this.itemsService.update(id, item);
    }

    @Delete(':id')
    async delete(@Param('id') id: string): Promise<any> {
        return this.itemsService.delete(id);
    }
}