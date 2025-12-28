import { Body, Controller, Get, Post } from '@nestjs/common';
import type { VoteCastEvent } from '@org/contracts';
import { BlockchainService } from './blockchain.service';

@Controller('chain')
export class BlockchainController {
  constructor(private readonly blockchain: BlockchainService) {}

  @Get()
  chain() {
    return this.blockchain.getChain();
  }

  @Get('verify')
  verify() {
    return this.blockchain.verify();
  }

  @Post('add')
  add(@Body() body: VoteCastEvent) {
    const block = this.blockchain.addBlock(body);
    return { ok: true, block };
  }
}
