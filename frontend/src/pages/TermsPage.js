import React from 'react';
import { Link } from 'react-router-dom';
import { TERMS_TITLE, TERMS_SECTIONS, TERMS_WARNING } from '@/constants/terms';
import { Button } from '@/components/ui/button';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4" data-testid="terms-page">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          <div className="mb-6 pb-4 border-b">
            <Link to="/" className="text-sm text-blue-600 hover:underline">
              ← Về trang chủ
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              📜 Điều Khoản Dịch Vụ
            </h1>
            <p className="text-lg text-gray-600 mt-2">{TERMS_TITLE}</p>
            <p className="text-xs text-gray-500 mt-2">Smart Mini Storage • Đà Nẵng</p>
          </div>

          <div className="prose max-w-none space-y-8">
            {TERMS_SECTIONS.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-xl font-bold text-gray-900 border-l-4 border-blue-500 pl-3 mb-3">
                  {section.title}
                </h2>
                {section.intro && <p className="text-gray-700 mb-3">{section.intro}</p>}
                <ul className="space-y-3">
                  {section.points.map((point, pidx) => (
                    <li key={pidx} className="bg-gray-50 rounded-md p-3 border-l-2 border-gray-300">
                      <p className="font-semibold text-gray-900">{point.heading}:</p>
                      <p className="text-sm text-gray-700 mt-1">{point.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
              <h2 className="text-lg font-bold text-red-900 mb-2">⚠️ Cảnh Báo Quan Trọng</h2>
              <p className="text-red-800 italic leading-relaxed">"{TERMS_WARNING}"</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t flex flex-col md:flex-row gap-3 justify-center">
            <Link to="/customer/register">
              <Button className="w-full md:w-auto">Đăng Ký Ngay</Button>
            </Link>
            <Link to="/customer/login">
              <Button variant="outline" className="w-full md:w-auto">Đã có tài khoản? Đăng nhập</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
