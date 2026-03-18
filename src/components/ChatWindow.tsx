import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
  orderId: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  orderStatus: string;
  onClose: () => void;
}

const ChatWindow = ({ orderId, receiverId, receiverName, receiverRole, orderStatus, onClose }: ChatWindowProps) => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const senderId = session?.user?.id;

  const isClosed = orderStatus === 'delivered' || orderStatus === 'cancelled';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!senderId || !orderId) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any).from('messages')
        .select('*')
        .eq('order_id', orderId)
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      setLoading(false);

      // Mark unread as read
      if (data?.length) {
        const unread = data.filter((m: any) => m.receiver_id === senderId && !m.is_read).map((m: any) => m.id);
        if (unread.length > 0) {
          await (supabase as any).from('messages').update({ is_read: true }).in('id', unread);
        }
      }
    };
    fetchMessages();

    // Realtime subscription for new messages
    const channel = supabase.channel(`chat-${orderId}-${receiverId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `order_id=eq.${orderId}`,
      }, (payload: any) => {
        const msg = payload.new;
        if ((msg.sender_id === senderId && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === senderId)) {
          setMessages(prev => [...prev, msg]);
          // Auto-mark as read
          if (msg.receiver_id === senderId && !msg.is_read) {
            (supabase as any).from('messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      })
      .subscribe();

    // Typing indicator via broadcast
    const typingChannel = supabase.channel(`typing-${orderId}-${receiverId}`)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload?.userId === receiverId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [senderId, orderId, receiverId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !senderId || isClosed) return;
    const text = newMessage.trim().slice(0, 300);
    setSending(true);
    setNewMessage('');
    try {
      await (supabase as any).from('messages').insert({
        order_id: orderId,
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: text,
      });
    } catch { /* handled by realtime */ }
    finally { setSending(false); }
  };

  const handleTyping = () => {
    supabase.channel(`typing-${orderId}-${senderId}`)
      .send({ type: 'broadcast', event: 'typing', payload: { userId: senderId } });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm truncate">{receiverName}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase">{receiverRole}</span>
            {isTyping && <span className="text-[10px] text-primary animate-pulse">{t('typing')}</span>}
          </div>
        </div>
        <button onClick={onClose} className="p-2"><X className="w-5 h-5 text-muted-foreground" /></button>
      </div>

      {/* Closed banner */}
      {isClosed && (
        <div className="bg-muted px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">{t('chat_closed')}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">{t('say_hello')}</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === senderId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                  isMine
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm break-words">{msg.message_text}</p>
                  <p className={`text-[10px] mt-0.5 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isClosed && (
        <div className="border-t border-border bg-card px-3 py-2 flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={t('type_message')}
            maxLength={300}
            className="flex-1 h-10 px-3 rounded-full bg-muted border-0 text-sm outline-none"
          />
          {newMessage.length > 200 && (
            <span className="text-[10px] text-muted-foreground shrink-0">{newMessage.length}/300</span>
          )}
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
