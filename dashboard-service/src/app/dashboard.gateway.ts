import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

type SubscribePayload = {
  electionId: string;
};

@WebSocketGateway({
  namespace: '/dashboard',
  cors: {
    origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
  },
})
export class DashboardGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: SubscribePayload) {
    const electionId = payload?.electionId?.trim();
    if (!electionId) {
      client.emit('error', { message: 'electionId required' });
      return;
    }

    client.join(this.room(electionId));
    client.emit('subscribed', { electionId });
    this.logger.debug(`Client ${client.id} subscribed to ${electionId}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: SubscribePayload) {
    const electionId = payload?.electionId?.trim();
    if (!electionId) return;
    client.leave(this.room(electionId));
    client.emit('unsubscribed', { electionId });
  }

  emitUpdate(electionId: string, results: Record<string, number>, lastUpdatedAt: Date) {
    this.server.to(this.room(electionId)).emit('results:update', {
      electionId,
      results,
      lastUpdatedAt,
    });
  }

  private room(electionId: string) {
    return `election:${electionId}`;
  }
}
