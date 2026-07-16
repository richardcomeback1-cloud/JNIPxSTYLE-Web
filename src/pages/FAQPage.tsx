import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'สั่งซื้อสินค้าอย่างไร?',
    a: 'เลือกสินค้าที่ต้องการ เพิ่มลงตะกร้า จากนั้นไปที่หน้าตะกร้าและคลิก "ดำเนินการชำระเงิน" กรอกที่อยู่จัดส่ง เลือกวิธีจัดส่งและชำระเงิน จากนั้นยืนยันคำสั่งซื้อได้เลย',
  },
  {
    q: 'มีวิธีชำระเงินอะไรบ้าง?',
    a: 'เรารองรับการชำระเงินหลายช่องทาง ได้แก่ โอนเงินผ่านธนาคาร, พร้อมเพย์, บัตรเครดิต และเก็บเงินปลายทาง (COD)',
  },
  {
    q: 'จัดส่งกี่วัน? ค่าจัดส่งเท่าไหร่?',
    a: 'จัดส่งมาตรฐาน 1-3 วันทำการ ค่าจัดส่ง ฿50 หรือฟรีเมื่อสั่งซื้อ ฿500 ขึ้นไป จัดส่งด่วน 1-2 วัน ค่าจัดส่ง ฿80',
  },
  {
    q: 'เปลี่ยนหรือคืนสินค้าได้ไหม?',
    a: 'สามารถเปลี่ยนหรือคืนสินค้าได้ภายใน 3 วันหลังจากได้รับสินค้า โดยสินค้าต้องอยู่ในสภาพเดิม ไม่ผ่านการใช้งาน และมีแท็กติดอยู่ครบถ้วน',
  },
  {
    q: 'สินค้าที่ได้ไม่ตรงไซส์ ทำอย่างไร?',
    a: 'หากได้สินค้าไม่ตรงไซส์ สามารถเปลี่ยนไซส์ได้ฟรีภายใน 3 วัน โดยติดต่อแอดมินผ่าน LINE OA @jnipxstyle พร้อมแจ้งหมายเลขคำสั่งซื้อ',
  },
  {
    q: 'มีรับประกันคุณภาพสินค้าไหม?',
    a: 'ทุกสินค้ารับประกันคุณภาพ หากพบข้อบกพร่องจากการผลิต สามารถเปลี่ยนใหม่ได้ฟรีภายใน 3 วัน',
  },
  {
    q: 'สมัครสมาชิกได้ประโยชน์อะไร?',
    a: 'สมาชิกจะได้รับส่วนลดพิเศษ สะสมแต้มแลกส่วนลด รับโปรโมชั่นก่อนใคร และติดตามสถานะคำสั่งซื้อได้สะดวกขึ้น',
  },
  {
    q: 'ติดตามสถานะคำสั่งซื้อได้อย่างไร?',
    a: 'เข้าสู่ระบบแล้วไปที่หน้า "บัญชีของฉัน" > "ประวัติคำสั่งซื้อ" จะเห็นสถานะล่าสุดของทุกคำสั่งซื้อ พร้อมหมายเลขพัสดุสำหรับติดตามการจัดส่ง',
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">FAQ</p>
        <h1 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">คำถามที่พบบ่อย</h1>
        <p className="text-taupe-400 mt-3">คำตอบสำหรับคำถามที่ถูกถามบ่อยที่สุด</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="font-medium text-taupe-600 pr-4">{faq.q}</span>
              <ChevronDown className={`w-5 h-5 text-taupe-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-taupe-400 text-sm leading-relaxed animate-fade-in">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
