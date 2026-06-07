// src/hooks/useTelegramBot.ts
// State management bot Telegram — messages, typing, learning

import { useState, useCallback, useRef } from 'react';
import { parseOrderWithAI, saveLearningPattern, type ParsedOrder } from '@/lib/orderParser';

// ─── Tipe pesan ───────────────────────────────────────────────────
export type MessageRole = 'user' | 'bot';
export type MessageType = 'text' | 'parsed_order' | 'error' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  text?: string;
  parsedOrder?: ParsedOrder;
  timestamp: Date;
  isAnimating?: boolean;
}

// ─── Pesan awal (seed percakapan) ────────────────────────────────
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'sys-1',
    role: 'bot',
    type: 'system',
    text: '🤖 Bot aktif. Ketik /daftar <nama_toko> untuk mulai.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'usr-1',
    role: 'user',
    type: 'text',
    text: '/daftar tokobudi',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  },
  {
    id: 'bot-1',
    role: 'bot',
    type: 'text',
    text: '✅ Bot berhasil terhubung ke toko: **tokobudi**!\n\nSekarang Anda bisa langsung ketik atau forward pesan order dari WhatsApp ke sini untuk direkap otomatis. AI akan parse nama, HP, dan produk secara otomatis.',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  },
];

// ─── Hook utama ───────────────────────────────────────────────────
export function useTelegramBot() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Tambah pesan user
    addMessage({ role: 'user', type: 'text', text });
    setInputText('');
    scrollToBottom();

    // Deteksi command khusus
    if (text.startsWith('/')) {
      const cmd = text.toLowerCase().trim();
      if (cmd.startsWith('/daftar')) {
        const nama = cmd.replace('/daftar', '').trim() || 'toko_anda';
        addMessage({
          role: 'bot',
          type: 'text',
          text: `✅ Bot terhubung ke toko: **${nama}**!\n\nSiap menerima order. Ketik pesan order Anda.`,
        });
      } else if (cmd === '/help') {
        addMessage({
          role: 'bot',
          type: 'text',
          text: '📋 **Perintah tersedia:**\n• /daftar <nama_toko> — daftarkan toko\n• /help — tampilkan bantuan\n\nAtau langsung ketik teks order untuk diparse AI.',
        });
      } else {
        addMessage({
          role: 'bot',
          type: 'error',
          text: `❓ Perintah tidak dikenal: ${text}. Ketik /help untuk bantuan.`,
        });
      }
      scrollToBottom();
      return;
    }

    // Deteksi konfirmasi
    const lowerText = text.toLowerCase().trim();
    if (lowerText === 'ya' || lowerText === 'y') {
      addMessage({
        role: 'bot',
        type: 'text',
        text: '✅ **Order berhasil dicatat!**\nSilakan cek dashboard untuk verifikasi lebih lanjut.',
      });
      scrollToBottom();
      return;
    }

    if (lowerText === 'batal' || lowerText === 'tidak' || lowerText === 'cancel') {
      addMessage({
        role: 'bot',
        type: 'text',
        text: '❌ **Order dibatalkan.**\nSilakan ketik order baru jika diperlukan.',
      });
      scrollToBottom();
      return;
    }

    // Parse order dengan AI
    setIsTyping(true);
    scrollToBottom();

    // Delay realistis "bot typing"
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    try {
      const parsed = await parseOrderWithAI(text);

      setIsTyping(false);
      addMessage({
        role: 'bot',
        type: 'parsed_order',
        parsedOrder: parsed,
      });
    } catch (err) {
      setIsTyping(false);
      addMessage({
        role: 'bot',
        type: 'error',
        text: `⚠️ Gagal parse order: ${err instanceof Error ? err.message : 'Error tidak diketahui'}`,
      });
    }

    scrollToBottom();
  }, [isTyping, addMessage, scrollToBottom]);

  // Simpan koreksi user → learning
  const saveCorrection = useCallback((originalText: string, correctedOrder: ParsedOrder) => {
    saveLearningPattern({
      input: originalText,
      corrected: correctedOrder,
      savedAt: Date.now(),
    });
    addMessage({
      role: 'bot',
      type: 'system',
      text: '✅ Koreksi disimpan! AI akan ingat pola ini untuk order berikutnya.',
    });
    scrollToBottom();
  }, [addMessage, scrollToBottom]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  }, [sendMessage, inputText]);

  return {
    messages,
    isTyping,
    inputText,
    setInputText,
    sendMessage,
    saveCorrection,
    handleKeyDown,
    bottomRef,
  };
}
