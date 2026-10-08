// src/data/pois.js
import { getPoiImages } from '../utils/poiImages';

export const POIS = [
  {
    id: 1, num: '01', cat: 'Di sản',
    name: 'Chùa Cầu', tag: 'Biểu tượng Hội An',
    desc: 'Cây cầu có mái che thế kỷ XVII do thương nhân Nhật Bản xây, in trên tờ tiền 20.000đ.',
    dist: 'Trung tâm', hours: '07:00–21:00', price: 'Vé 120.000đ', addr: 'Nguyễn Thị Minh Khai',
    lng: 108.3260, lat: 15.8769,
    imgs: getPoiImages(1),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 2, num: '02', cat: 'Di sản',
    name: 'Nhà cổ Tấn Ký', tag: 'Nhà cổ 1741',
    desc: 'Ngôi nhà cổ 7 đời họ Lê, kiến trúc Việt – Hoa – Nhật hoà quyện, đã 280+ năm tuổi.',
    dist: '150m', hours: '08:00–18:00', price: 'Vé 120.000đ', addr: '101 Nguyễn Thái Học',
    lng: 108.3266, lat: 15.8772,
    imgs: getPoiImages(2),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 3, num: '03', cat: 'Di sản',
    name: 'Hội quán Phúc Kiến', tag: 'Hội quán 1690',
    desc: 'Hội quán người Hoa gốc Phúc Kiến, thờ Thiên Hậu Thánh Mẫu, kiến trúc chữ "Tam".',
    dist: '250m', hours: '07:30–18:00', price: 'Vé 120.000đ', addr: '46 Trần Phú',
    lng: 108.3272, lat: 15.8768,
    imgs: getPoiImages(3),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 4, num: '04', cat: 'Di sản',
    name: 'Hội quán Triều Châu', tag: 'Hội quán 1776',
    desc: 'Hội quán người Triều Châu — kiến trúc đắp nổi độc đáo, còn nguyên vẹn đến nay.',
    dist: '300m', hours: '08:00–17:30', price: 'Vé 120.000đ', addr: '157 Nguyễn Duy Hiệu',
    lng: 108.3283, lat: 15.8773,
    imgs: getPoiImages(4),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 5, num: '05', cat: 'Di sản',
    name: 'Hội quán Quảng Đông', tag: 'Hội quán 1885',
    desc: 'Hội quán người Quảng Đông, thờ Quan Công, kiến trúc trùng thiềm điệp ốc.',
    dist: '280m', hours: '08:00–18:00', price: 'Vé 120.000đ', addr: '17 Trần Phú',
    lng: 108.3269, lat: 15.8765,
    imgs: getPoiImages(5),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 6, num: '06', cat: 'Di sản',
    name: 'Nhà cổ Phùng Hưng', tag: 'Nhà cổ 1780',
    desc: 'Nhà cổ hơn 230 năm, kiến trúc 2 tầng gỗ, từng là nơi giao thương thương nhân.',
    dist: '320m', hours: '08:00–18:00', price: 'Vé 120.000đ', addr: '4 Nguyễn Thị Minh Khai',
    lng: 108.3270, lat: 15.8767,
    imgs: getPoiImages(6),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 7, num: '07', cat: 'Tôn giáo',
    name: 'Chùa Quan Âm', tag: 'Chùa cổ 1650',
    desc: 'Ngôi chùa hơn 350 năm tuổi, kiến trúc Nho giáo triều Thanh, bảo tàng sống của Hội An.',
    dist: '260m', hours: '06:00–18:00', price: 'Miễn phí', addr: '67 Trần Phú',
    lng: 108.3275, lat: 15.8770,
    imgs: getPoiImages(7),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 8, num: '08', cat: 'Tôn giáo',
    name: 'Chùa Phước Lâm', tag: 'Chùa cổ 1750',
    desc: 'Chùa hơn 270 năm tuổi, mái ngói âm dương, chạm khắc rồng tinh xảo.',
    dist: '1.2km', hours: '06:00–18:00', price: 'Miễn phí', addr: '14 Nguyễn Trường Tộ',
    lng: 108.3300, lat: 15.8790,
    imgs: getPoiImages(8),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 9, num: '09', cat: 'Ẩm thực',
    name: 'Cao lầu Bà Phước', tag: 'Đặc sản',
    desc: 'Món ăn biểu tượng — sợi mì vàng óng, xá xíu, da heo giòn, nước dùng đậm đà.',
    dist: '200m', hours: '06:00–22:00', price: '35.000–55.000đ', addr: '2 Trần Phú',
    lng: 108.3275, lat: 15.8770,
    imgs: getPoiImages(9),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 10, num: '10', cat: 'Ẩm thực',
    name: 'Bánh mì Phượng', tag: 'Street food',
    desc: 'Tiệm bánh mì nổi tiếng thế giới — vỏ giòn rụm, pate, chả, thịt nguội và rau thơm.',
    dist: '120m', hours: '06:30–19:00', price: '20.000–40.000đ', addr: '2B Phan Châu Trinh',
    lng: 108.3260, lat: 15.8763,
    imgs: getPoiImages(10),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 11, num: '11', cat: 'Ẩm thực',
    name: 'Cơm gà Bà Buội', tag: 'Cơm',
    desc: 'Cơm vàng nghệ, gà xé phay trộn rau răm, hành phi — hương vị đặc trưng phố cổ.',
    dist: '350m', hours: '10:00–21:00', price: '40.000–60.000đ', addr: '22 Phan Châu Trinh',
    lng: 108.3288, lat: 15.8778,
    imgs: getPoiImages(11),
    video: 'https://www.youtube.com/embed/8Tg5t-GG-6E'
  },

  {
    id: 12, num: '12', cat: 'Ẩm thực',
    name: 'White Rose', tag: 'Bánh',
    desc: 'Bánh bao hoa hồng trắng nhân tôm thịt, hấp chín, rắc hành phi — thanh tao, tinh tế.',
    dist: '280m', hours: '10:00–20:00', price: '30.000–50.000đ', addr: '533 Hai Bà Trưng',
    lng: 108.3253, lat: 15.8783,
    imgs: getPoiImages(12),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 13, num: '13', cat: 'Ẩm thực',
    name: 'Chè bắp Cẩm Nam', tag: 'Tráng miệng',
    desc: 'Chè bắp nấu nước cốt dừa, đậu phộng rang, ăn kèm bánh tráng nướng giòn.',
    dist: '420m', hours: '14:00–22:00', price: '10.000–20.000đ', addr: 'Cẩm Nam',
    lng: 108.3300, lat: 15.8752,
    imgs: getPoiImages(13),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 14, num: '14', cat: 'Làng nghề',
    name: 'Làng gốm Thanh Hà', tag: 'Làng gốm 500 năm',
    desc: 'Làng gốm truyền thống hơn 500 năm, có lớp làm gốm cho du khách trải nghiệm.',
    dist: '3km', hours: '08:00–17:30', price: 'Vé 35.000đ', addr: 'Phạm Phán, Thanh Hà',
    lng: 108.3380, lat: 15.8830,
    imgs: getPoiImages(14),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 15, num: '15', cat: 'Làng nghề',
    name: 'Làng mộc Kim Bồng', tag: 'Làng mộc 400 năm',
    desc: 'Làng mộc lâu đời bên sông Thu Bồn, có lớp chạm khắc gỗ 3 giờ cho du khách.',
    dist: '2.5km', hours: '08:00–17:00', price: 'Lớp 200.000đ', addr: 'Cẩm Kim',
    lng: 108.3320, lat: 15.8720,
    imgs: getPoiImages(15),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 16, num: '16', cat: 'Làng nghề',
    name: 'Làng rau Trà Quế', tag: 'Làng rau 400 năm',
    desc: 'Làng rau 400 năm, lớp nấu ăn, đạp xe qua ruộng lúa — trải nghiệm xanh mát.',
    dist: '3km', hours: '07:00–17:00', price: 'Tour 250.000đ', addr: 'Trà Quế, Cẩm Hà',
    lng: 108.3350, lat: 15.8880,
    imgs: getPoiImages(16),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 17, num: '17', cat: 'Gần Hội An',
    name: 'Thánh địa Mỹ Sơn', tag: 'Di sản UNESCO',
    desc: 'Tháp Chăm thế kỷ 4–13, cách Hội An ~1h xe — di sản văn hoá thế giới UNESCO.',
    dist: '40km', hours: '06:30–17:30', price: 'Vé 150.000đ', addr: 'Duy Phú, Duy Xuyên',
    lng: 108.3500, lat: 15.7640,
    imgs: getPoiImages(17),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 18, num: '18', cat: 'Gần Hội An',
    name: 'Cù Lao Chàm', tag: 'Đảo · Khu dự trữ sinh quyển',
    desc: 'Đảo xanh với làng chài cổ, homestay, lặn ngắm san hô — khu dự trữ sinh quyển UNESCO.',
    dist: '15km', hours: '07:00–17:00', price: 'Tour 400.000đ', addr: 'Tân Hiệp',
    lng: 108.4830, lat: 15.9520,
    imgs: getPoiImages(18),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  },

  {
    id: 19, num: '19', cat: 'Gần Hội An',
    name: 'Biển An Bàng', tag: 'Bãi biển đẹp',
    desc: 'Bãi biển cát vàng đẹp nhất gần Hội An, cách phố cổ 4km — hoàng hôn tuyệt đẹp.',
    dist: '4km', hours: 'Cả ngày', price: 'Miễn phí', addr: 'An Bàng, Cẩm An',
    lng: 108.3390, lat: 15.9120,
    imgs: getPoiImages(19),
    video: 'https://www.youtube.com/embed/1La4QzGeaaQ'
  },

  {
    id: 20, num: '20', cat: 'Gần Hội An',
    name: 'Rừng dừa Bảy Mẫu', tag: 'Thuyền thúng',
    desc: 'Rừng dừa nước với trò đi thuyền thúng độc đáo — cách phố cổ ~5km.',
    dist: '5km', hours: '07:00–18:00', price: 'Tour 150.000đ', addr: 'Cẩm Thanh',
    lng: 108.3420, lat: 15.8830,
    imgs: getPoiImages(20),
    video: 'https://www.youtube.com/embed/9VGPWQ8eQjQ'
  }
];