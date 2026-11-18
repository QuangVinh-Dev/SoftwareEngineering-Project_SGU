import { Volume2, Mail, Phone, MapPin, Facebook, Youtube, Instagram, Heart } from 'lucide-react';

const year = new Date().getFullYear();

const columns = [
  { title: 'Về chúng tôi', links: ['Giới thiệu', 'Câu chuyện Hội An', 'Tuyển dụng', 'Báo chí'] },
  { title: 'Dành cho chủ gian hàng', links: ['Hướng dẫn sử dụng', 'Chính sách duyệt POI', 'Biểu phí', 'Câu hỏi thường gặp'] },
  { title: 'Hỗ trợ', links: ['Trung tâm trợ giúp', 'Liên hệ', 'Điều khoản sử dụng', 'Chính sách bảo mật'] },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-brown-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-md shadow-violet-600/20">
                <Volume2 className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-[15px] font-bold tracking-tight text-brown-900">
                  Hội An<span className="text-[#7C3AED]">.</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-brown-400">Audio Guide</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-brown-500">
              Nền tảng thuyết minh du lịch đa ngôn ngữ cho phố cổ Hội An. Kể câu chuyện di sản bằng chính giọng nói của người bản địa.
            </p>
            <div className="mt-5 space-y-2.5">
              <a href="mailto:hello@hoianaudioguide.vn" className="flex items-center gap-2.5 text-[13px] text-brown-600 transition-colors hover:text-[#7C3AED]">
                <Mail className="h-4 w-4 text-brown-400" /> hello@hoianaudioguide.vn
              </a>
              <a href="tel:+84905123456" className="flex items-center gap-2.5 text-[13px] text-brown-600 transition-colors hover:text-[#7C3AED]">
                <Phone className="h-4 w-4 text-brown-400" /> +84 905 123 456
              </a>
              <p className="flex items-start gap-2.5 text-[13px] text-brown-600">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brown-400" />
                Nguyễn Thị Minh Khai, Cẩm Châu, Hội An, Quảng Nam
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {[Facebook, Youtube, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-md border border-brown-200 text-brown-500 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-[#7C3AED]">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
            {columns.map(col => (
              <div key={col.title}>
                <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-brown-900">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-[13px] text-brown-500 transition-colors hover:text-[#7C3AED]">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-brown-100 pt-6 sm:flex-row">
          <p className="text-[12px] text-brown-400">© {year} Hội An Audio Guide. Tất cả các quyền được bảo lưu.</p>
          <p className="flex items-center gap-1.5 text-[12px] text-brown-400">
            Made with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> tại Hội An
          </p>
        </div>
      </div>
    </footer>
  );
}