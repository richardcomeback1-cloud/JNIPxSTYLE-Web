import { Truck, RefreshCw, ShieldCheck, Lock } from 'lucide-react';

export function ShippingPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">นโยบาย</p>
        <h1 className="font-prompt text-3xl font-bold text-taupe-600">นโยบายการจัดส่งและคืนสินค้า</h1>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-rose-100 space-y-8">
        <section>
          <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-rose-500" /> การจัดส่งสินค้า
          </h2>
          <div className="space-y-3 text-taupe-500 text-sm leading-relaxed">
            <p>• จัดส่งมาตรฐาน: 1-3 วันทำการ (ค่าจัดส่ง ฿50 หรือฟรีเมื่อสั่งซื้อ ฿500 ขึ้นไป)</p>
            <p>• จัดส่งด่วน: 1-2 วันทำการ (ค่าจัดส่ง ฿80)</p>
            <p>• จัดส่งผ่านบริษัทขนส่ง: Kerry, Flash Express, Thailand Post</p>
            <p>• สั่งซื้อก่อน 14:00 น. จัดส่งภายในวันเดียวกัน (เฉพาะวันทำการ)</p>
            <p>• สามารถติดตามสถานะการจัดส่งได้ผ่านหน้าบัญชีของฉัน</p>
          </div>
        </section>
        <section>
          <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-rose-500" /> นโยบายการเปลี่ยน/คืนสินค้า
          </h2>
          <div className="space-y-3 text-taupe-500 text-sm leading-relaxed">
            <p>• สามารถเปลี่ยนหรือคืนสินค้าได้ภายใน 3 วันหลังจากได้รับสินค้า</p>
            <p>• สินค้าต้องอยู่ในสภาพเดิม ไม่ผ่านการใช้งาน มีแท็กติดอยู่ครบถ้วน</p>
            <p>• สินค้าที่ซื้อในราคาลดราคา ไม่สามารถคืนได้ (ยกเว้นสินค้ามีตำหนิจากการผลิต)</p>
            <p>• การเปลี่ยนไซส์: ฟรี ภายใน 3 วัน (ลูกค้ารับผิดชอบค่าจัดส่งสินค้ากลับ)</p>
            <p>• การคืนสินค้า: คืนเงินเต็มจำนวนภายใน 3 วันทำการหลังได้รับสินค้าคืน</p>
            <p>• ติดต่อเปลี่ยน/คืนสินค้าผ่าน LINE OA: @jnipxstyle</p>
          </div>
        </section>
        <section>
          <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-500" /> รับประกันคุณภาพ
          </h2>
          <div className="space-y-3 text-taupe-500 text-sm leading-relaxed">
            <p>• รับประกันของแท้ 100%</p>
            <p>• สินค้ามีตำหนิจากการผลิต เปลี่ยนใหม่ฟรีภายใน 3 วัน</p>
            <p>• สอบถามรายละเอียดเพิ่มเติมได้ที่ฝ่ายบริการลูกค้า</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">นโยบาย</p>
        <h1 className="font-prompt text-3xl font-bold text-taupe-600">นโยบายความเป็นส่วนตัว</h1>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-rose-100 space-y-6">
        <section>
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-500" /> การเก็บรักษาข้อมูล
          </h2>
          <p className="text-taupe-500 text-sm leading-relaxed">
            เราเก็บข้อมูลส่วนบุคคลของคุณ เช่น ชื่อ-นามสกุล ที่อยู่ เบอร์โทรศัพท์ อีเมล เพื่อใช้ในการดำเนินการสั่งซื้อ
            จัดส่งสินค้า และติดต่อสื่อสารกับลูกค้า เราจะไม่เปิดเผยข้อมูลของคุณแก่บุคคลที่สามโดยไม่ได้รับอนุญาต
          </p>
        </section>
        <section>
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-3">การใช้ข้อมูล</h2>
          <div className="space-y-2 text-taupe-500 text-sm leading-relaxed">
            <p>• ใช้สำหรับการดำเนินการสั่งซื้อและจัดส่งสินค้า</p>
            <p>• ใช้สำหรับการแจ้งสถานะคำสั่งซื้อและการติดต่อสื่อสาร</p>
            <p>• ใช้สำหรับการส่งข่าวสารและโปรโมชั่น (สามารถยกเลิกได้ตลอดเวลา)</p>
            <p>• ใช้สำหรับการปรับปรุงบริการและสินค้าของเรา</p>
          </div>
        </section>
        <section>
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-3">ความปลอดภัย</h2>
          <p className="text-taupe-500 text-sm leading-relaxed">
            เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ รวมถึงการเข้ารหัส SSL
            ในการรับส่งข้อมูล และจัดเก็บข้อมูลในระบบที่ปลอดภัย
          </p>
        </section>
        <section>
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-3">สิทธิของคุณ</h2>
          <div className="space-y-2 text-taupe-500 text-sm leading-relaxed">
            <p>• คุณสามารถขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้ตลอดเวลา</p>
            <p>• คุณสามารถขอเลิกรับข่าวสารได้ตลอดเวลา</p>
            <p>• คุณสามารถขอลบบัญชีผู้ใช้ได้โดยติดต่อฝ่ายบริการลูกค้า</p>
          </div>
        </section>
      </div>
    </div>
  );
}
