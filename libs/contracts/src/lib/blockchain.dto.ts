import type { VoteCastEvent } from './vote.dto.js';

export interface BlockDto {
  index: number;
  timestamp: number;
  data: VoteCastEvent;
  prevHash: string;
  hash: string;
}