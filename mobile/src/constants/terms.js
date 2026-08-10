export const TERMS_TITLE = 'Quy Trình An Ninh & Tuân Thủ Pháp Lý';

export const TERMS_SECTIONS = [
  {
    title: '1. Cơ sở Pháp lý & Trách nhiệm của Khách hàng',
    intro: 'Mô hình lưu trữ theo yêu cầu (On-demand Storage) vận hành dựa trên sự ràng buộc nghiêm ngặt giữa hệ thống công nghệ và trách nhiệm pháp lý của người gửi:',
    points: [
      {
        heading: 'Nghĩa vụ khai báo và bồi thường',
        body: 'Theo Khoản 2 Điều 555 Bộ luật Dân sự 2015, khách hàng có nghĩa vụ thông báo trung thực về tình trạng tài sản. Nếu cố tình che giấu hàng hóa nguy hiểm gây thiệt hại cho kho tổng hoặc tài sản của người khác, khách hàng phải bồi thường toàn bộ thiệt hại và chịu trách nhiệm trước pháp luật.'
      },
      {
        heading: 'Cam kết trên ứng dụng',
        body: 'Trước khi xác nhận đơn hàng, khách hàng bắt buộc phải tick chọn điều khoản cam kết không gửi hàng cấm. Mọi thông tin khai báo được gắn định danh mã QR với tài khoản khách hàng để truy xuất trách nhiệm khi cần.'
      }
    ]
  },
  {
    title: '2. Danh mục Hàng cấm Lưu trữ tuyệt đối',
    intro: 'Dự án áp dụng bộ lọc nghiêm ngặt đối với các danh mục hàng hóa sau theo quy định của Luật pháp Việt Nam:',
    points: [
      {
        heading: 'Vũ khí, vật liệu nổ',
        body: 'Nghiêm cấm tàng trữ, vận chuyển các loại vũ khí quân dụng, công cụ hỗ trợ, pháo hoa, thuốc nổ theo Điều 5 Luật Quản lý, sử dụng vũ khí, vật liệu nổ và công cụ hỗ trợ 2017.'
      },
      {
        heading: 'Chất ma túy',
        body: 'Nghiêm cấm tuyệt đối mọi hành vi lưu trữ, vận chuyển chất ma túy, tiền chất, thuốc hướng thần theo Điều 5 Luật Phòng, chống ma túy 2021.'
      },
      {
        heading: 'Hàng hóa nguy hiểm, dễ cháy nổ',
        body: 'Cấm các chất dễ cháy, hóa chất độc hại gây nguy cơ hỏa hoạn trong không gian kín theo Khoản 11 Điều 8 Luật Phòng cháy và chữa cháy 2001.'
      },
      {
        heading: 'Hàng lậu, hàng giả',
        body: 'Cấm lưu trữ hàng hóa không rõ nguồn gốc xuất xứ, hàng giả số lượng lớn nhằm mục đích trốn thuế hoặc kinh doanh bất hợp pháp theo Nghị định 98/2020/NĐ-CP.'
      },
      {
        heading: 'Hàng hữu cơ, tươi sống',
        body: 'Không nhận động vật, thực phẩm tươi sống, hàng hóa dễ phân hủy gây mùi nhằm bảo vệ môi trường lưu trữ khô ráo của kho tổng.'
      }
    ]
  },
  {
    title: '3. Quy trình Kiểm soát Vận hành (Hai lớp)',
    intro: '',
    points: [
      {
        heading: 'Kiểm soát tại tuyến trước (Shipper)',
        body: 'Dựa trên Điều 29 Luật Bưu chính 2010, shipper có quyền từ chối nhận bưu gửi nếu nghi ngờ có hàng cấm mà khách hàng không hợp tác mở kiểm tra. Khách hàng phải tự tay dán seal/mã QR niêm phong dưới sự chứng kiến của bưu tá.'
      },
      {
        heading: 'Kiểm soát tại hậu trường (Kho tổng)',
        body: 'Sử dụng thiết bị rà quét kim loại/công nghệ cảm biến IoT giám sát nhiệt độ, độ ẩm thời gian thực nhằm phát hiện sớm các bất thường. Hệ thống camera CCTV lưu trữ 30 ngày đóng vai trò làm bằng chứng đối chiếu.'
      }
    ]
  }
];

export const TERMS_WARNING = 'Nếu khách hàng vi phạm điều khoản hàng cấm, Smart Mini Storage sẽ lập tức phong tỏa tài sản, tịch thu tiền cọc và bàn giao toàn bộ dữ liệu định danh cho cơ quan chức năng (Công an, Quản lý thị trường) xử lý theo pháp luật Việt Nam mà không cần báo trước.';
