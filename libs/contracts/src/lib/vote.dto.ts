export interface CastVoteRequestDto {
  electionId: string;
  candidateId: string;
}

export interface VoteCastEvent {
  voterId: string;
  electionId: string;
  candidateId: string;
  timestamp: number;
}