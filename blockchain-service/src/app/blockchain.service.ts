import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { BlockDto, VoteCastEvent } from '@org/contracts';
import { getMongoDb } from './db/mongo';

@Injectable()
export class BlockchainService {
  private chain: BlockDto[] = [];
  private loading: Promise<void> | null = null;

  async getChain(): Promise<BlockDto[]> {
    await this.ensureChain();
    return this.chain;
  }

  async addBlock(data: VoteCastEvent): Promise<BlockDto> {
    await this.ensureChain();
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
    await this.persistBlock(block);
    return block;
  }

  async verify(): Promise<{ valid: boolean; invalidIndex?: number; reason?: string }> {
    await this.ensureChain();
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

  private async ensureChain(): Promise<void> {
    if (this.chain.length > 0) return;
    if (!this.loading) {
      this.loading = this.loadFromDb();
    }
    await this.loading;
  }

  private async loadFromDb(): Promise<void> {
    const db = await getMongoDb();
    const collection = db.collection<BlockDto>('blockchain_blocks');
    const docs = await collection.find({}).sort({ index: 1 }).toArray();

    if (docs.length === 0) {
      const genesis = this.createGenesisBlock();
      await collection.insertOne({ ...genesis });
      this.chain = [genesis];
      return;
    }

    this.chain = docs.map((doc) => ({
      index: doc.index,
      timestamp: doc.timestamp,
      data: doc.data,
      prevHash: doc.prevHash,
      hash: doc.hash,
    }));
  }

  private async persistBlock(block: BlockDto): Promise<void> {
    const db = await getMongoDb();
    const collection = db.collection<BlockDto>('blockchain_blocks');
    await collection.insertOne({ ...block });
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
