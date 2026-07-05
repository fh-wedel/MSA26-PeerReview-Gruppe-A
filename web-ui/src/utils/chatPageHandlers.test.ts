import { describe, it, expect, vi } from 'vitest';
import { handleNewGeneralChatLogic, handleNewSubmissionChatLogic } from './chatPageHandlers';
import type { UserSummary } from '../api/communication';

describe('chatPageHandlers', () => {
  it('handleNewGeneralChatLogic with existing chat', () => {
    const setSearchOpen = vi.fn();
    const setSelectedChatId = vi.fn();
    const setSelectedRecipientId = vi.fn();
    const setUserMap = vi.fn();
    const setChatTypeTab = vi.fn();

    const chats = [{ chatType: 'GENERAL', otherParticipantId: 'user1', chatId: 'chat1' }];
    const selectedUser = { id: 'user1', username: 'Test' } as UserSummary;

    handleNewGeneralChatLogic(selectedUser, chats, setSearchOpen, setSelectedChatId, setSelectedRecipientId, setUserMap, setChatTypeTab);

    expect(setSearchOpen).toHaveBeenCalledWith(false);
    expect(setSelectedChatId).toHaveBeenCalledWith('chat1');
    expect(setSelectedRecipientId).toHaveBeenCalledWith('user1');
    expect(setChatTypeTab).toHaveBeenCalledWith('GENERAL');
  });

  it('handleNewGeneralChatLogic without existing chat', () => {
    const setSearchOpen = vi.fn();
    const setSelectedChatId = vi.fn();
    const setSelectedRecipientId = vi.fn();
    const setUserMap = vi.fn();
    const setChatTypeTab = vi.fn();

    const chats: any[] = [];
    const selectedUser = { id: 'user1', username: 'Test' } as UserSummary;

    handleNewGeneralChatLogic(selectedUser, chats, setSearchOpen, setSelectedChatId, setSelectedRecipientId, setUserMap, setChatTypeTab);

    expect(setSearchOpen).toHaveBeenCalledWith(false);
    expect(setSelectedChatId).toHaveBeenCalledWith(null);
    expect(setSelectedRecipientId).toHaveBeenCalledWith('user1');
    expect(setChatTypeTab).toHaveBeenCalledWith('GENERAL');
  });

  it('handleNewSubmissionChatLogic with existing chat', () => {
    const setSubmissionSearchOpen = vi.fn();
    const setSelectedChatId = vi.fn();
    const setSelectedRecipientId = vi.fn();
    const setPendingSubmissionId = vi.fn();
    const setChatTypeTab = vi.fn();

    const chats = [{ chatType: 'SUBMISSION', submissionId: 'sub1', chatId: 'chat1' }];

    handleNewSubmissionChatLogic('sub1', chats, setSubmissionSearchOpen, setSelectedChatId, setSelectedRecipientId, setPendingSubmissionId, setChatTypeTab);

    expect(setSubmissionSearchOpen).toHaveBeenCalledWith(false);
    expect(setSelectedChatId).toHaveBeenCalledWith('chat1');
    expect(setSelectedRecipientId).toHaveBeenCalledWith(null);
    expect(setChatTypeTab).toHaveBeenCalledWith('SUBMISSION');
    expect(setPendingSubmissionId).toHaveBeenCalledWith(null);
  });

  it('handleNewSubmissionChatLogic without existing chat', () => {
    const setSubmissionSearchOpen = vi.fn();
    const setSelectedChatId = vi.fn();
    const setSelectedRecipientId = vi.fn();
    const setPendingSubmissionId = vi.fn();
    const setChatTypeTab = vi.fn();

    const chats: any[] = [];

    handleNewSubmissionChatLogic('sub1', chats, setSubmissionSearchOpen, setSelectedChatId, setSelectedRecipientId, setPendingSubmissionId, setChatTypeTab);

    expect(setSubmissionSearchOpen).toHaveBeenCalledWith(false);
    expect(setSelectedChatId).toHaveBeenCalledWith(null);
    expect(setSelectedRecipientId).toHaveBeenCalledWith(null);
    expect(setPendingSubmissionId).toHaveBeenCalledWith('sub1');
    expect(setChatTypeTab).toHaveBeenCalledWith('SUBMISSION');
  });
});
