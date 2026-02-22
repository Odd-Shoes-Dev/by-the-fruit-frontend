"""
WebSocket consumer for real-time channel chat (Phase 3).
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token
from .models import ChannelMember, ChannelMessage


class ChannelChatConsumer(AsyncWebsocketConsumer):
    """Real-time chat for investor-founder channels."""

    async def connect(self):
        self.channel_id = self.scope['url_route']['kwargs']['channel_id']
        self.room_group_name = f'channel_{self.channel_id}'

        token_key = None
        for q in (self.scope.get('query_string') or b'').decode().split('&'):
            if q.startswith('token='):
                token_key = q.split('=', 1)[1]
                break

        if not token_key:
            await self.close(code=4001)
            return

        user = await self.authenticate_token(token_key)
        if not user:
            await self.close(code=4002)
            return

        is_member = await self.check_channel_membership(user.id)
        if not is_member:
            await self.close(code=4003)
            return

        self.scope['user'] = user
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = (data.get('content') or '').strip()
            if not content:
                return
        except json.JSONDecodeError:
            return

        user = self.scope.get('user')
        if not user:
            return

        msg = await self.save_message(content, user.id)
        if not msg:
            return

        payload = {
            'type': 'chat_message',
            'id': msg['id'],
            'content': msg['content'],
            'sender_id': msg['sender_id'],
            'sender_name': msg['sender_name'],
            'created_at': msg['created_at'],
        }
        await self.channel_layer.group_send(self.room_group_name, payload)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'id': event['id'],
            'content': event['content'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def authenticate_token(self, token_key):
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def check_channel_membership(self, user_id):
        return ChannelMember.objects.filter(
            channel_id=self.channel_id,
            user_id=user_id,
            invite_status='accepted'
        ).exists()

    @database_sync_to_async
    def save_message(self, content, user_id):
        try:
            msg = ChannelMessage.objects.create(
                channel_id=int(self.channel_id),
                sender_id=user_id,
                content=content
            )
            sender = msg.sender
            return {
                'id': msg.id,
                'content': msg.content,
                'sender_id': sender.id,
                'sender_name': sender.full_name or sender.email or 'Unknown',
                'created_at': msg.created_at.isoformat() if msg.created_at else None,
            }
        except Exception:
            return None
