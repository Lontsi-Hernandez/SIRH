import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationType } from '../../domain/entities/notification.entity';

interface WsPayload {
  tenantId: string;
  employeeId: string;
  type: NotificationType;
  data: any;
}

/**
 * HrmsWebSocketGateway — Gateway WebSocket temps réel
 * Événements supportés:
 * - shift:updated    → Changement de quart de travail
 * - leave:reviewed   → Congé approuvé/rejeté
 * - payroll:ready    → Bulletin de paie disponible
 * - notification:new → Nouvelle notification générique
 * - message:new      → Nouveau message interne
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/hrms',
})
export class HrmsWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(HrmsWebSocketGateway.name);

  // Map: employeeId → socketId[]
  private connectedUsers = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialisé');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client['user'] = payload;

      // Joindre les rooms par tenant et par employé
      client.join(`tenant:${payload.tenantId}`);
      client.join(`employee:${payload.sub}`);

      // Enregistrer la connexion
      if (!this.connectedUsers.has(payload.sub)) {
        this.connectedUsers.set(payload.sub, new Set());
      }
      this.connectedUsers.get(payload.sub)!.add(client.id);

      this.logger.log(`✅ Client connecté: ${payload.email} (${client.id})`);
      client.emit('connected', { message: 'Connecté au serveur HRMS', employeeId: payload.sub });
    } catch {
      this.logger.warn(`❌ Connexion refusée: token invalide (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client['user'];
    if (user) {
      this.connectedUsers.get(user.sub)?.delete(client.id);
      this.logger.log(`👋 Client déconnecté: ${user.email}`);
    }
  }

  // ── Méthodes d'émission (utilisées par les services) ──────────────────────

  /** Envoie une notification à un employé spécifique */
  sendToEmployee(employeeId: string, event: string, data: any) {
    this.server.to(`employee:${employeeId}`).emit(event, data);
  }

  /** Envoie un événement à tous les membres d'un tenant */
  sendToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  /** Envoie une notification générique */
  sendNotification(employeeId: string, notification: any) {
    this.sendToEmployee(employeeId, 'notification:new', notification);
  }

  // ── Gestionnaires de messages entrants ────────────────────────────────────

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('message:send')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const user = client['user'];
    // Relayer au destinataire
    this.sendToEmployee(data.recipientId, 'message:new', {
      ...data,
      senderId: user.sub,
      senderName: user.name,
      timestamp: new Date().toISOString(),
    });
  }
}
