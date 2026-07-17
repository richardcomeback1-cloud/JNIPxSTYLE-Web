import { useEffect, useState } from 'react';
import { Phone, Mail, Facebook, Instagram, Send, MapPin } from 'lucide-react';
import { navigate } from '../lib/router';
import { fetchSiteSettings, DEFAULT_STORE_INFO, type StoreInfo } from '../lib/siteSettings';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);

  useEffect(() => {
    fetchSiteSettings().then((s) => setStoreInfo(s.storeInfo));
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-taupe-500 text-cream mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <h3 className="font-serif text-2xl font-bold">
                JNIP <span className="text-rose-300">X</span> Style
              </h3>
              <p className="text-[10px] tracking-[0.3em] text-rose-200 uppercase mt-1">Define Your Style</p>
            </div>
            <p className="text-sm text-cream/70 leading-relaxed mb-4">
              ชุดนักเรียน-นักศึกษาและอุปกรณ์ที่เกี่ยวข้อง คุณภาพดี ราคาเหมาะสม ตอบโจทย์นักเรียนนักศึกษาทุกระดับชั้น
            </p>
            <div className="flex gap-3">
              <a href={storeInfo.facebook || '#'} target={storeInfo.facebook ? '_blank' : undefined} rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-cream/10 hover:bg-rose-500 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={storeInfo.instagram || '#'} target={storeInfo.instagram ? '_blank' : undefined} rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-cream/10 hover:bg-rose-500 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={storeInfo.line || '#'} target={storeInfo.line ? '_blank' : undefined} rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-cream/10 hover:bg-rose-500 flex items-center justify-center transition-colors" aria-label="LINE">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-prompt text-lg mb-4 text-rose-200">ลิงก์ด่วน</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><button onClick={() => navigate('/shop')} className="hover:text-rose-300 transition-colors">สินค้าทั้งหมด</button></li>
              <li><button onClick={() => navigate('/category/on-sale')} className="hover:text-rose-300 transition-colors">สินค้าลดราคา</button></li>
              <li><button onClick={() => navigate('/about')} className="hover:text-rose-300 transition-colors">เกี่ยวกับเรา</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-rose-300 transition-colors">ติดต่อเรา</button></li>
              <li><button onClick={() => navigate('/faq')} className="hover:text-rose-300 transition-colors">คำถามที่พบบ่อย</button></li>
              <li><button onClick={() => navigate('/shipping-policy')} className="hover:text-rose-300 transition-colors">นโยบายจัดส่ง & คืนสินค้า</button></li>
              <li><button onClick={() => navigate('/privacy')} className="hover:text-rose-300 transition-colors">นโยบายความเป็นส่วนตัว</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-prompt text-lg mb-4 text-rose-200">ช่องทางติดต่อ</h4>
            <ul className="space-y-3 text-sm text-cream/70">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-rose-300 shrink-0" />
                <span>{storeInfo.phone}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-rose-300 shrink-0" />
                <span>{storeInfo.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <Send className="w-4 h-4 mt-0.5 text-rose-300 shrink-0" />
                <span>LINE OA: @jnipxstyle</span>
              </li>
              {storeInfo.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-rose-300 shrink-0" />
                  <span>{storeInfo.address}</span>
                </li>
              )}
            </ul>
            <div className="mt-4">
              <p className="text-xs text-cream/50 mb-2">เวลาทำการ: จันทร์-เสาร์ 9:00-19:00 น.</p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-prompt text-lg mb-4 text-rose-200">สมัครรับข่าวสาร</h4>
            <p className="text-sm text-cream/70 mb-4">
              รับส่วนลดและโปรโมชั่นพิเศษก่อนใคร
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมลของคุณ"
                className="w-full px-4 py-2.5 bg-cream/10 border border-cream/20 rounded-full text-cream placeholder-cream/40 focus:outline-none focus:border-rose-300 text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-colors text-sm font-medium"
              >
                {subscribed ? 'สมัครสำเร็จ!' : 'สมัครรับข่าวสาร'}
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">พร้อมเพย์</span>
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">บัตรเครดิต</span>
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">True Money</span>
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">COD</span>
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">Kerry</span>
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">Flash</span>
              <span className="text-[10px] bg-cream/10 px-2 py-1 rounded">Thailand Post</span>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-6 text-center text-xs text-cream/50">
          <p>&copy; {new Date().getFullYear()} JNIP X Style. สงวนลิขสิทธิ์ทุกประการ.</p>
        </div>
      </div>
    </footer>
  );
}
