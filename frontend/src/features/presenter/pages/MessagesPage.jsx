import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send, MessagesSquare, Search, Check, CheckCheck } from 'lucide-react';
import { getSocket } from '@/services/socket';
import { listMyConversations, getMessages, markConversationRead } from '../api/chatApi';
import { getConversationLabel, getOtherParticipant } from '@/utils/conversationLabel';

const initials = (name = '') =>
  name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const TYPING_IDLE_MS = 2000;
const SELF_ROLE = 'presenter';

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [activeId, setActiveId] = useState(searchParams.get('conversationId') || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeId) || null,
    [conversations, activeId]
  );

  const otherParticipantId = useMemo(
    () => getOtherParticipant(activeConversation, SELF_ROLE)?._id || null,
    [activeConversation]
  );

  const filteredConversations = conversations.filter((c) => {
    if (!conversationSearch.trim()) return true;
    const label = getConversationLabel(c, SELF_ROLE);
    return label.toLowerCase().includes(conversationSearch.toLowerCase());
  });

  const loadConversations = async () => {
    setIsLoadingConvos(true);
    try {
      const { data } = await listMyConversations();
      setConversations(data.data);
      if (!activeId && data.data.length > 0) {
        setActiveId(data.data[0]._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setIsLoadingConvos(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;

    const socket = getSocket();
    setIsLoadingMessages(true);
    setOtherTyping(false);

    const loadThread = async () => {
      try {
        const { data } = await getMessages(activeId, { page: 1, limit: 50 });
        setMessages(data.data);
        await markConversationRead(activeId);
        socket.emit('mark_read', { conversationId: activeId });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadThread();

    socket.emit('join_conversation', { conversationId: activeId });

    const handleNewMessage = (message) => {
      if (message.conversation === activeId) {
        setMessages((prev) => [...prev, message]);
        socket.emit('mark_read', { conversationId: activeId });
      }
      loadConversations();
    };

    const handleMessagesRead = ({ conversationId, readerId }) => {
      if (conversationId !== activeId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.readBy?.includes(readerId) ? m : { ...m, readBy: [...(m.readBy || []), readerId] }
        )
      );
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (conversationId === activeId && userId === otherParticipantId) setOtherTyping(true);
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === activeId && userId === otherParticipantId) setOtherTyping(false);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, otherParticipantId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    if (!activeId) return;

    const socket = getSocket();
    socket.emit('typing', { conversationId: activeId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: activeId });
    }, TYPING_IDLE_MS);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;

    const socket = getSocket();
    socket.emit('stop_typing', { conversationId: activeId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit('send_message', { conversationId: activeId, content: draft.trim() }, (response) => {
      if (!response?.success) {
        toast.error(response?.message || 'Failed to send message');
      }
    });
    setDraft('');
  };

  return (
    <div className="flex flex-col sm:flex-row h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col shrink-0 max-h-52 sm:max-h-none">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConvos ? (
            <p className="p-4 text-sm text-slate-500">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessagesSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                {conversations.length === 0
                  ? 'No conversations yet. Message a college from your Bookings page to start one.'
                  : 'No conversations match your search.'}
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const label = getConversationLabel(c, SELF_ROLE);
              const other = getOtherParticipant(c, SELF_ROLE);
              return (
                <button
                  key={c._id}
                  onClick={() => setActiveId(c._id)}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    activeId === c._id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {initials(other?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {c.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  {c.lastMessageAt && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(c.lastMessageAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation to view messages
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {initials(getOtherParticipant(activeConversation, SELF_ROLE)?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {getConversationLabel(activeConversation, SELF_ROLE)}
                </p>
                {otherTyping && <p className="text-xs text-primary">typing...</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <p className="text-sm text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center mt-10">
                  No messages yet — say hello!
                </p>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender?.role === 'presenter';
                  const isRead =
                    isMine && otherParticipantId && m.readBy?.includes(otherParticipantId);
                  return (
                    <div
                      key={m._id}
                      className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2 text-sm ${
                        isMine
                          ? 'bg-primary text-primary-foreground ml-auto rounded-br-sm'
                          : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="break-words">{m.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] opacity-70">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine &&
                          (isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                          ) : (
                            <Check className="w-3.5 h-3.5 opacity-70" />
                          ))}
                      </div>
                    </div>
                  );
                })
              )}
              {otherTyping && (
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 w-fit">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-slate-200 p-3 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={handleDraftChange}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
