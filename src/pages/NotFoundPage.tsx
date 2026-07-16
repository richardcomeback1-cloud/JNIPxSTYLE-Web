import { Home, ArrowRight } from 'lucide-react';
import { navigate } from '../lib/router';

export default function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
      <div className="mb-8">
        <p className="font-serif text-8xl lg:text-9xl font-bold text-rose-200">404</p>
      </div>
      <h1 className="font-prompt text-2xl font-bold text-taupe-600 mb-3">ไม่พบหน้าที่คุณค้นหา</h1>
      <p className="text-taupe-400 mb-8">หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่มีอยู่</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          กลับหน้าแรก
        </button>
        <button
          onClick={() => navigate('/shop')}
          className="px-6 py-3 border border-taupe-400 text-taupe-500 rounded-full font-medium hover:bg-taupe-50 transition-colors flex items-center gap-2"
        >
          ช้อปเลย <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
