import { describe, it, expect, vi } from 'vitest';
import { handleChatSseMessage } from './chatContextHelpers';

describe('handleChatSseMessage', () => {
  it('ignores events other than message', () => {
    const setMessagesStream = vi.fn();
    const refreshChats = vi.fn();
    handleChatSseMessage({ event: 'ping' }, '1', setMessagesStream, refreshChats);
    expect(setMessagesStream).not.toHaveBeenCalled();
  });

  it('sets messages stream if sender is different', () => {
    vi.useFakeTimers();
    const setMessagesStream = vi.fn();
    const refreshChats = vi.fn();
    handleChatSseMessage({ data: JSON.stringify({ message: { senderId: '2' }, chatId: 'c1' }) }, '1', setMessagesStream, refreshChats);
    expect(setMessagesStream).toHaveBeenCalledWith({ message: { senderId: '2' }, chatId: 'c1' });
    vi.runAllTimers();
    expect(refreshChats).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not set messages stream if sender is same', () => {
    vi.useFakeTimers();
    const setMessagesStream = vi.fn();
    const refreshChats = vi.fn();
    handleChatSseMessage({ data: JSON.stringify({ message: { senderId: '1' }, chatId: 'c1' }) }, '1', setMessagesStream, refreshChats);
    expect(setMessagesStream).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(refreshChats).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('catches parse error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setMessagesStream = vi.fn();
    const refreshChats = vi.fn();
    handleChatSseMessage({ data: 'invalid json' }, '1', setMessagesStream, refreshChats);
    expect(setMessagesStream).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
