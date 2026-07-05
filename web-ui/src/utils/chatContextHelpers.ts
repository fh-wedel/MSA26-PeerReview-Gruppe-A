import { Message } from '../api/communication';

export const handleChatSseMessage = (
  ev: any,
  userId: string | undefined,
  setMessagesStream: (val: any) => void,
  refreshChats: () => void
) => {
  if (!ev.event || ev.event === 'message') {
    try {
      const data = JSON.parse(ev.data);
      const newMsg = data.message as Message;
      const chatId = data.chatId;

      if (newMsg.senderId !== userId) {
        setMessagesStream({ message: newMsg, chatId });
      }

      setTimeout(refreshChats, 500);
    } catch (err) {
      console.error('[SSE] Error parsing SSE message! Raw data was:', ev.data, err);
    }
  }
};
