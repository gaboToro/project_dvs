import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { BlockDto, VoteCastEvent } from '@org/contracts';

@Injectable()
export class BlockchainService {
  private readonly chain: BlockDto[] = [this.createGenesisBlock()];

  getChain(): BlockDto[] {
    return this.chain;
  }

  addBlock(data: VoteCastEvent): BlockDto {
    const latest = this.chain[this.chain.length - 1];

    const block: BlockDto = {
      index: latest.index + 1,
      timestamp: Date.now(),
      data,
      prevHash: latest.hash,
      hash: '',
    };

    block.hash = this.calculateHash(block);
    this.chain.push(block);
    return block;
  }

  verify(): { valid: boolean; invalidIndex?: number; reason?: string } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];

      if (current.prevHash !== prev.hash) {
        return { valid: false, invalidIndex: i, reason: 'prevHash mismatch' };
      }

      const recalculated = this.calculateHash({
        ...current,
        hash: '',
      } as BlockDto);

      if (current.hash !== recalculated) {
        return { valid: false, invalidIndex: i, reason: 'hash mismatch' };
      }
    }
    return { valid: true };
  }

  private createGenesisBlock(): BlockDto {
    const genesis: BlockDto = {
      index: 0,
      timestamp: Date.now(),
      data: {
        voterId: 'genesis',
        electionId: 'genesis',
        candidateId: 'genesis',
        timestamp: Date.now(),
      },
      prevHash: '0',
      hash: '',
    };

    genesis.hash = this.calculateHash(genesis);
    return genesis;
  }

  private calculateHash(block: BlockDto): string {
    const payload = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      prevHash: block.prevHash,
    });

    return createHash('sha256').update(payload).digest('hex');
  }
}
