import { useState } from 'react';
import { Phone, Mail, Send, MapPin, Clock, Facebook, Instagram } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-12">
        <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">Contact Us</p>
        <h1 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">ติดต่อเรา</h1>
        <p className="text-taupe-400 mt-3">มีคำถามหรือข้อสงสัย? ติดต่อเราได้ตลอดเวลา</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-rose-100">
            <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">ช่องทางติดต่อ</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-taupe-600">โทรศัพท์</p>
                  <p className="text-sm text-taupe-400">02-123-4567, 081-234-5678</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-taupe-600">อีเมล</p>
                  <p className="text-sm text-taupe-400">support@jnipxstyle.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-taupe-600">LINE OA</p>
                  <p className="text-sm text-taupe-400">@jnipxstyle</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-taupe-600">ที่อยู่</p>
                  <p className="text-sm text-taupe-400">123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-taupe-600">เวลาทำการ</p>
                  <p className="text-sm text-taupe-400">จันทร์-เสาร์ 9:00-19:00 น. (หยุดอาทิตย์และนักขัตฤกษ์)</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-rose-100">
              <a href="#" className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-500 flex items-center justify-center transition-colors group">
                <Facebook className="w-5 h-5 text-rose-500 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-500 flex items-center justify-center transition-colors group">
                <Instagram className="w-5 h-5 text-rose-500 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-500 flex items-center justify-center transition-colors group">
                <Send className="w-5 h-5 text-rose-500 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl p-2 border border-rose-100 overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.5!2d100.5808!3d13.7247!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQzJzI4LjkiTiAxMDTCsDM0JzUwLjkiRQ!5e0!3m2!1sen!2sth!4v1234567890"
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: '1rem' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="แผนที่ร้าน JNIP X Style"
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 border border-rose-100">
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">ส่งข้อความถึงเรา</h2>
          {sent && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-sm text-rose-500">
              ส่งข้อความสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-taupe-400 block mb-1">ชื่อ-นามสกุล *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">อีเมล *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">หัวข้อ *</label>
              <input
                required
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">ข้อความ *</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
            >
              ส่งข้อความ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
