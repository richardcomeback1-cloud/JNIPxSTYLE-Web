import { Mail, Clock, CheckCircle, Reply } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ContactMessage } from '../../types';

interface Props {
  messages: ContactMessage[];
  onMessagesChange: (messages: ContactMessage[]) => void;
}

const statusConfig = {
  new: { label: 'ใหม่', color: 'bg-rose-50 text-rose-500', icon: Clock },
  read: { label: 'อ่านแล้ว', color: 'bg-blue-50 text-blue-500', icon: Mail },
  replied: { label: 'ตอบแล้ว', color: 'bg-green-50 text-green-500', icon: CheckCircle },
};

export default function AdminMessages({ messages, onMessagesChange }: Props) {
  const updateStatus = async (id: string, status: ContactMessage['status']) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) return;
    onMessagesChange(messages.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  return (
    <div>
      <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">ข้อความติดต่อ ({messages.length})</h2>
      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-rose-100 text-center">
          <Mail className="w-12 h-12 text-rose-300 mx-auto mb-4" />
          <p className="text-taupe-400">ยังไม่มีข้อความติดต่อ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const cfg = statusConfig[m.status] || statusConfig.new;
            return (
              <div key={m.id} className="bg-white rounded-2xl p-5 border border-rose-100">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-taupe-600 text-sm">{m.subject}</p>
                    <p className="text-xs text-taupe-400">
                      {m.name} · {m.email} · {new Date(m.created_at).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                    <cfg.icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-taupe-500 leading-relaxed bg-cream rounded-xl p-3 mb-3">{m.message}</p>
                <div className="flex gap-2">
                  {m.status === 'new' && (
                    <button onClick={() => updateStatus(m.id, 'read')} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> ทำเครื่องหมายว่าอ่านแล้ว
                    </button>
                  )}
                  {m.status !== 'replied' && (
                    <button onClick={() => updateStatus(m.id, 'replied')} className="text-xs px-3 py-1.5 bg-green-50 text-green-500 rounded-full hover:bg-green-100 transition-colors flex items-center gap-1">
                      <Reply className="w-3.5 h-3.5" /> ทำเครื่องหมายว่าตอบแล้ว
                    </button>
                  )}
                  <a
                    href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                    className="text-xs px-3 py-1.5 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    <Reply className="w-3.5 h-3.5" /> ตอบกลับทางอีเมล
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
