import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from app.connectors.base import BaseConnector


class SlackConnector(BaseConnector):
    """Treats each channel as one 'file' — its message history — since
    that's where institutional knowledge actually lives (attachments go
    through Drive/Dropbox/upload anyway). Needs a bot token (xoxb-...)
    with channels:history, channels:read, and users:read scopes, and the
    bot must be invited into each channel it should read.
    """

    def __init__(self, bot_token: str | None = None):
        self.bot_token = bot_token or os.getenv("SLACK_BOT_TOKEN")
        self.client = None
        self._user_names: dict[str, str] = {}

    def authenticate(self):
        if not self.bot_token:
            raise ValueError("No Slack bot token found. Set SLACK_BOT_TOKEN.")
        self.client = WebClient(token=self.bot_token)
        return self.client

    def _resolve_user(self, user_id: str) -> str:
        if user_id not in self._user_names:
            try:
                info = self.client.users_info(user=user_id)
                self._user_names[user_id] = info["user"]["real_name"] or user_id
            except SlackApiError:
                self._user_names[user_id] = user_id
        return self._user_names[user_id]

    def list_files(self) -> list[dict]:
        if self.client is None:
            self.authenticate()

        channels: list[dict] = []
        cursor = None

        while True:
            response = self.client.conversations_list(
                types="public_channel", cursor=cursor, limit=200
            )
            for channel in response["channels"]:
                if not channel.get("is_member"):
                    continue
                channels.append(
                    {
                        "id": channel["id"],
                        "name": f"#{channel['name']}",
                        "file_type": "text/plain",
                        "modified_time": None,
                        # changes whenever the channel gets new activity,
                        # so an unchanged channel gets skipped next sync
                        "fingerprint": str(channel.get("updated", "")),
                    }
                )
            cursor = response.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break

        return channels

    def download_file(self, file_id: str) -> bytes:
        if self.client is None:
            self.authenticate()

        lines: list[str] = []
        cursor = None

        while True:
            response = self.client.conversations_history(
                channel=file_id, cursor=cursor, limit=200
            )
            for msg in reversed(response["messages"]):
                if not msg.get("text"):
                    continue
                author = self._resolve_user(msg.get("user", "unknown"))
                lines.append(f"{author}: {msg['text']}")
            cursor = response.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break

        return "\n".join(lines).encode("utf-8")