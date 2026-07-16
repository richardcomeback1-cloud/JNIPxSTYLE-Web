import { Target, Eye, Heart, Award, Users, ShoppingBag } from 'lucide-react';
import { navigate } from '../lib/router';
import OptimizedImage from '../components/OptimizedImage';

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 to-cream/40 z-10" />
        <OptimizedImage src="https://images.pexels.com/photos/8617715/pexels-photo-8617715.jpeg" alt="About" priority loading="eager" className="w-full h-full object-cover" />
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-3">เกี่ยวกับเรา</p>
              <h1 className="font-prompt text-4xl lg:text-5xl font-bold text-taupe-600 mb-4">
                เรื่องราวของ JNIP X Style
              </h1>
              <p className="text-lg text-taupe-400">
                ก่อตั้งขึ้นเพื่อให้ทุกคนเข้าถึงชุดนักเรียน-นักศึกษาคุณภาพดีในราคาที่เหมาะสม
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">Brand Story</p>
          <h2 className="font-prompt text-3xl font-bold text-taupe-600 mb-6">เรื่องราวแบรนด์</h2>
        </div>
        <div className="prose prose-lg max-w-none">
          <p className="text-taupe-500 leading-relaxed text-lg mb-6">
            JNIP X Style ก่อตั้งขึ้นเพื่อให้ทุกคนสามารถเลือกซื้อชุดนักเรียน-นักศึกษาคุณภาพดีได้ในราคาที่เหมาะสม
            เราใส่ใจในทุกรายละเอียดของสินค้า พร้อมบริการที่เป็นกันเอง เพื่อตอบโจทย์นักเรียนนักศึกษาทุกระดับชั้น
          </p>
          <p className="text-taupe-500 leading-relaxed text-lg mb-6">
            เราเชื่อว่าการแต่งกายที่เหมาะสมเป็นจุดเริ่มต้นของความมั่นใจในการเรียน ชุดนักเรียน-นักศึกษา
            ไม่ใช่แค่เครื่องแบบ แต่คือการแสดงออกถึงตัวตนและความพร้อมในการเรียนรู้
          </p>
          <p className="text-taupe-500 leading-relaxed text-lg">
            ด้วยประสบการณ์และความใส่ใจ เราคัดสรรสินค้าคุณภาพดี ทนทาน สวมใส่สบาย ในราคาที่เข้าถึงได้
            พร้อมบริการหลังการขายที่ดี เพื่อให้ทุกการซื้อของคุณเป็นประสบการณ์ที่น่าพอใจ
          </p>
        </div>
      </section>

      {/* Vision / Mission */}
      <section className="bg-white border-y border-rose-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-8 bg-cream rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="font-prompt text-xl font-bold text-taupe-600 mb-3">วิสัยทัศน์</h3>
              <p className="text-taupe-400 leading-relaxed">
                เป็นแบรนด์ชุดนักเรียน-นักศึกษาชั้นนำที่ผู้ปกครองและนักเรียนนักศึกษาไว้วางใจ
                ด้วยคุณภาพ ราคา และบริการที่เป็นกันเอง
              </p>
            </div>
            <div className="text-center p-8 bg-cream rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="font-prompt text-xl font-bold text-taupe-600 mb-3">พันธกิจ</h3>
              <p className="text-taupe-400 leading-relaxed">
                มอบสินค้าคุณภาพดีในราคาที่เหมาะสม พร้อมบริการที่เป็นกันเอง
                และตอบโจทย์นักเรียน-นักศึกษาทุกระดับชั้น
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">Our Values</p>
          <h2 className="font-prompt text-3xl font-bold text-taupe-600">ค่านิยมของเรา</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Award, title: 'คุณภาพ', desc: 'คัดสรรสินค้าคุณภาพดี ทนทาน สวมใส่สบาย' },
            { icon: Heart, title: 'บริการ', desc: 'บริการที่เป็นกันเอง ใส่ใจทุกรายละเอียด' },
            { icon: Users, title: 'ตอบโจทย์', desc: 'เข้าใจความต้องการของนักเรียน-นักศึกษาทุกคน' },
          ].map((v, i) => (
            <div key={i} className="text-center p-6 bg-white rounded-2xl border border-rose-100">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <v.icon className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-prompt text-lg font-bold text-taupe-600 mb-2">{v.title}</h3>
              <p className="text-sm text-taupe-400">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-rose-200 via-accent to-rose-100 rounded-3xl p-8 lg:p-12 text-center">
          <h2 className="font-prompt text-2xl lg:text-3xl font-bold text-taupe-600 mb-4">
            พร้อมแต่งเต็มทุกช่วงวัยการเรียนแล้วหรือยัง?
          </h2>
          <p className="text-taupe-400 mb-6">เลือกซื้อสินค้าคุณภาพดีในราคาที่เหมาะสมได้เลยวันนี้</p>
          <button
            onClick={() => navigate('/shop')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-taupe-500 text-white rounded-full font-medium hover:bg-taupe-600 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            ช้อปเลย
          </button>
        </div>
      </section>
    </div>
  );
}
