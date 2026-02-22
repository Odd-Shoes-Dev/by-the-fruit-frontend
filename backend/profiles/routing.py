"""
WebSocket URL routing for profiles app (Phase 3).
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/channels/(?P<channel_id>\d+)/$', consumers.ChannelChatConsumer.as_asgi()),
]
