import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Notification } from '../../domain/entities/notification.entity';
import { Message, Announcement } from '../../domain/entities/user.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Notification, Message, Announcement])], exports: [TypeOrmModule] })
export class NotificationsModule {}
