import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import logoImg from '@/assets/logo.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 transition-all border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src={logoImg} alt="Smart Mini Storage Logo" className="h-20 w-auto object-contain" />
            </Link>
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#about" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Về Chúng Tôi</a>
              <a href="#features" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Dịch Vụ</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-700 font-medium transition-colors">Bảng Giá</a>
              <Link to="/shipper" className="text-gray-500 hover:text-orange-500 font-medium transition-colors">Dành cho Shipper</Link>
              {user ? (
                <Link to="/customer/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-md">
                    Vào tài khoản: {user.name}
                  </Button>
                </Link>
              ) : (
                <Link to="/customer/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-md px-6">
                    Đăng nhập / Đăng ký
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
        <motion.div 
          className="flex-1 space-y-8 text-center lg:text-left"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
            Lưu trữ thông minh <br />
            <span className="text-blue-600">Vận chuyển an toàn</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Giải pháp hoàn hảo giúp bạn tối ưu không gian sống, tiết kiệm chi phí và bảo quản tài sản an toàn tuyệt đối. Chuyên nghiệp, nhanh chóng và tin cậy ngay tại Đà Nẵng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link to="/customer/register">
              <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                Bắt đầu lưu trữ ngay 🚀
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl border-2 hover:bg-gray-50">
                Tìm hiểu thêm
              </Button>
            </a>
          </div>
          
          <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">✓ Không hợp đồng dài hạn</div>
            <div className="flex items-center gap-2">✓ Trả theo diện tích sử dụng</div>
          </div>
        </motion.div>
        <motion.div 
          className="flex-1 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Abstract Hero Image replacing actual image */}
          <div className="w-full h-80 sm:h-96 lg:h-[500px] bg-gradient-to-tr from-blue-100 to-green-50 rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-white/50">
            <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 left-10 w-40 h-40 bg-green-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative h-full w-full bg-white/60 backdrop-blur-sm rounded-2xl border border-white p-6 shadow-sm flex flex-col justify-center items-center">
              <div className="text-8xl mb-6 shadow-sm">📦</div>
              <h3 className="text-2xl font-bold text-slate-800 text-center">Giao Nhận Tận Nơi</h3>
              <p className="text-slate-500 text-center mt-2 max-w-xs">Chỉ với 1 chạm trên ứng dụng, chúng tôi sẽ đến lấy đồ của bạn.</p>
              
              {/* Floating badges */}
              <div className="absolute -left-6 top-1/4 bg-white p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="text-2xl">📱</span>
                <div className="text-sm">
                  <p className="font-bold text-slate-800">App quản lý</p>
                  <p className="text-gray-500 text-xs">Tiện lợi, mọi lúc</p>
                </div>
              </div>
              
              <div className="absolute -right-6 bottom-1/4 bg-white p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
                <span className="text-2xl">🔒</span>
                <div className="text-sm">
                  <p className="font-bold text-slate-800">Bảo mật</p>
                  <p className="text-gray-500 text-xs">Mã QR & Seal</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PAIN POINTS SECTION */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Vấn đề bạn đang gặp phải?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Chúng tôi hiểu những khó khăn trong việc quản lý không gian sống và lưu trữ tài sản.</p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card className="border-none shadow-lg bg-blue-50/50 hover:bg-blue-50 transition-all hover:-translate-y-2 h-full">
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                    ✈️
                  </div>
                  <CardTitle className="text-xl text-blue-900">Khách du lịch</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 space-y-2">
                  <p>• Hành lý nhiều, cồng kềnh khó di chuyển.</p>
                  <p>• Chi phí gửi hoặc vận chuyển quá cao.</p>
                  <p>• Lo ngại mất mát, hư hỏng tài sản giá trị.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="border-none shadow-lg bg-indigo-50/50 hover:bg-indigo-50 transition-all hover:-translate-y-2 h-full">
                <CardHeader>
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                    🏬
                  </div>
                  <CardTitle className="text-xl text-indigo-900">Chủ Shop Online</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 space-y-2">
                  <p>• Hàng hóa chiếm dụng diện tích sinh hoạt.</p>
                  <p>• Áp lực chi phí thuê mặt bằng dài hạn.</p>
                  <p>• Hàng hóa đối mặt nguy cơ ẩm mốc, thất thoát.</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="border-none shadow-lg bg-green-50/50 hover:bg-green-50 transition-all hover:-translate-y-2 h-full">
                <CardHeader>
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                    🏠
                  </div>
                  <CardTitle className="text-xl text-green-900">Hộ gia đình</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 space-y-2">
                  <p>• Không gian sống ngày càng thu hẹp.</p>
                  <p>• Đồ đạc ít dùng (theo mùa) chất đống bám bụi.</p>
                  <p>• Thiếu giải pháp lưu trữ an toàn & linh hoạt.</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CORE VALUES / SOLUTIONS */}
      <section id="features" className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold mb-4">Giải Pháp Đề Xuất Của Chúng Tôi</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Khép kín, an toàn và tối ưu hoàn toàn trên điện thoại của bạn.</p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl">📦</div>
              <h3 className="text-xl font-bold text-blue-300">Lưu trữ linh hoạt</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• Cung cấp nhiều kích thước thùng.</li>
                <li>• Thuê theo ngày/tuần/tháng linh động.</li>
                <li>• Trả tiền đúng với diện tích sử dụng thực tế.</li>
              </ul>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl">🚚</div>
              <h3 className="text-xl font-bold text-green-300">Giao nhận tận nơi</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• Nhận đồ tại nhà, vận chuyển và lưu kho.</li>
                <li>• Hỗ trợ giao trả đồ khi cần ngay lập tức.</li>
                <li>• Giúp giảm thời gian và công sức tự di chuyển.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl">🔒</div>
              <h3 className="text-xl font-bold text-purple-300">An toàn & Bảo quản</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• Camera giám sát 24/7, kiểm soát ra vào.</li>
                <li>• Hạn chế ẩm mốc, côn trùng tuyệt đối.</li>
                <li>• Quy trình niêm phong bằng QR & Seal an toàn.</li>
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="text-4xl">📱</div>
              <h3 className="text-xl font-bold text-pink-300">Quản lý trên số hóa</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>• Đặt kho, thanh toán online nhanh gọn.</li>
                <li>• Theo dõi hạn lưu trữ, chi tiết hàng hóa.</li>
                <li>• Yêu cầu giao trả trực tuyến mọi lúc.</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS (5 STEPS) */}
      <section id="how-it-works" className="py-20 bg-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Quy trình khép kín 5 bước</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Không cần tự vận chuyển, chúng tôi lo mọi thứ cho bạn.</p>
          </motion.div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-blue-200 -translate-y-1/2 rounded-full"></div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                { step: 1, title: 'Đặt đơn', desc: 'Chọn kích thước và ngày giờ trên ứng dụng', icon: '📱' },
                { step: 2, title: 'Giao thùng rỗng', desc: 'Shipper mang thùng chuyên dụng đến tận nhà', icon: '📦' },
                { step: 3, title: 'Đóng gói & Niêm phong', desc: 'Tự đóng gói, dán mã QR bảo mật', icon: '🔐' },
                { step: 4, title: 'Vận chuyển lưu kho', desc: 'Hàng hóa được mang về Hub an toàn', icon: '🚛' },
                { step: 5, title: 'Yêu cầu trả lại', desc: 'Chỉ 1 chạm, đồ sẽ được giao lại tận cửa', icon: '✅' },
              ].map((item) => (
                <motion.div 
                  key={item.step} 
                  variants={fadeInUp}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-20 h-20 bg-white rounded-full border-4 border-blue-500 flex items-center justify-center text-3xl shadow-lg mb-4 cursor-pointer"
                  >
                    {item.icon}
                  </motion.div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Bước {item.step}: {item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Bảng Giá Dành Cho Khách Hàng</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Minh bạch, rõ ràng, không phát sinh chi phí ẩn. Tích hợp AI định tuyến giao nhận.</p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {/* Size S */}
            <motion.div variants={fadeInUp} className="h-full">
              <Card className="h-full border-gray-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-2 relative overflow-hidden flex flex-col">
                <div className="h-2 w-full bg-blue-400 absolute top-0 left-0"></div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-slate-800">Size S (Thùng nhỏ)</CardTitle>
                  <p className="text-gray-500 text-sm mt-2">52 x 36.5 x 27.5 cm (~52.2L)</p>
                </CardHeader>
                <CardContent className="text-center flex flex-col h-full">
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-blue-600">4.000₫</span>
                    <span className="text-gray-500">/ngày</span>
                  </div>
                  <div className="mb-8 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Hoặc 120.000₫/tháng
                  </div>
                  <ul className="text-sm text-left text-gray-600 space-y-3 mb-8 flex-grow">
                    <li className="flex items-start gap-2"><span>✅</span> 3-5 đôi giày, tài liệu, balo laptop.</li>
                    <li className="flex items-start gap-2"><span>✅</span> 25-30 áo hoặc 15-20 quần.</li>
                    <li className="flex items-start gap-2"><span>✅</span> Quét mã định danh quản lý riêng.</li>
                  </ul>
                  <Link to="/customer/register" className="mt-auto">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Chọn gói này</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Size M */}
            <motion.div variants={fadeInUp} className="h-full transform md:-translate-y-4">
              <Card className="h-full border-green-500 shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-2 relative overflow-hidden flex flex-col">
                <div className="absolute top-4 right-[-35px] bg-green-500 text-white text-xs font-bold px-10 py-1 rotate-45 shadow-sm">
                  PHỔ BIẾN
                </div>
                <div className="h-2 w-full bg-green-500 absolute top-0 left-0"></div>
                <CardHeader className="text-center pb-2 pt-8">
                  <CardTitle className="text-2xl font-bold text-slate-800">Size M (Tiêu chuẩn)</CardTitle>
                  <p className="text-gray-500 text-sm mt-2">62 x 44.5 x 32 cm (~88.4L)</p>
                </CardHeader>
                <CardContent className="text-center flex flex-col h-full">
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-green-600">6.000₫</span>
                    <span className="text-gray-500">/ngày</span>
                  </div>
                  <div className="mb-8 text-sm font-medium text-green-800 bg-green-50 p-2 rounded-lg border border-green-100">
                    Hoặc 180.000₫/tháng
                  </div>
                  <ul className="text-sm text-left text-gray-600 space-y-3 mb-8 flex-grow">
                    <li className="flex items-start gap-2"><span>✅</span> Đồ cắm trại, chăn mền, đồ thể thao.</li>
                    <li className="flex items-start gap-2"><span>✅</span> 50-60 áo hoặc 30-35 quần.</li>
                    <li className="flex items-start gap-2"><span>✅</span> Tối ưu lưu trữ mùa đông.</li>
                  </ul>
                  <Link to="/customer/register" className="mt-auto">
                    <Button className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg">Chọn gói này</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Size L */}
            <motion.div variants={fadeInUp} className="h-full">
              <Card className="h-full border-gray-200 shadow-md hover:shadow-xl transition-all hover:-translate-y-2 relative overflow-hidden flex flex-col">
                <div className="h-2 w-full bg-purple-500 absolute top-0 left-0"></div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-slate-800">Size L (Thùng lớn)</CardTitle>
                  <p className="text-gray-500 text-sm mt-2">69.5 x 50 x 36 cm (~125.1L)</p>
                </CardHeader>
                <CardContent className="text-center flex flex-col h-full">
                  <div className="my-6">
                    <span className="text-4xl font-extrabold text-purple-600">9.000₫</span>
                    <span className="text-gray-500">/ngày</span>
                  </div>
                  <div className="mb-8 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Hoặc 270.000₫/tháng
                  </div>
                  <ul className="text-sm text-left text-gray-600 space-y-3 mb-8 flex-grow">
                    <li className="flex items-start gap-2"><span>✅</span> Vali lớn, chăn ga gối nệm, áo phao.</li>
                    <li className="flex items-start gap-2"><span>✅</span> 80-100 áo hoặc 45-55 quần.</li>
                    <li className="flex items-start gap-2"><span>✅</span> Phù hợp chuyển trọ, đồ cồng kềnh.</li>
                  </ul>
                  <Link to="/customer/register" className="mt-auto">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">Chọn gói này</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <img src={logoImg} alt="Smart Mini Storage Logo" className="h-30 w-auto object-contain bg-white/10 rounded p-2" />
            </div>
            <p className="text-sm mb-4 max-w-sm">
              Lưu trữ thông minh - Vận chuyển an toàn. Chúng tôi cung cấp giải pháp kho bãi số hóa khép kín dành cho khách du lịch, hộ gia đình và shop online.
            </p>
            <p className="text-sm">📧 Email hỗ trợ: AnhTTH@smartmini.vn | TriDM@smartmini.vn</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#about" className="hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Dịch vụ</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Bảng giá</a></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Điều khoản & Chính sách</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Hệ thống</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/customer/login" className="hover:text-white transition-colors">Đăng nhập Khách hàng</Link></li>
              <li><Link to="/shipper" className="hover:text-white transition-colors">Cổng Shipper</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Cổng Quản trị viên</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          &copy; {new Date().getFullYear()} Smart Mini Storage. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
