import urllib.request, cv2, numpy as np
from main import detect_and_embed_faces

urls = [
  ('12 (28).JPG', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778457/snapshare/images/1794778449350-526168842-12__28__jzzvsk.jpg'),
  ('12 (29).JPG', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778459/snapshare/images/1794778449418-170061820-12__29__afkb43.jpg'),
  ('12 (37).JPG', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778461/snapshare/images/1794778449475-188911154-12__37__klirco.jpg'),
  ('20250109_142328.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778463/snapshare/images/1794778449505-541845747-20250109_142328_k7z9uf.jpg'),
  ('20250109_142336.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778465/snapshare/images/1794778449526-568143984-20250109_142336_derypn.jpg'),
  ('20250110_150631.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778467/snapshare/images/1794778449559-671402060-20250110_150631_y3hakc.jpg'),
  ('20250110_150756.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778469/snapshare/images/1794778449592-861440766-20250110_150756_zfewup.jpg'),
  ('20250110_182824.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778471/snapshare/images/1794778449653-842356399-20250110_182824_xqyalc.jpg'),
  ('20250110_182847.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778472/snapshare/images/1794778449691-904197684-20250110_182847_m5kpkl.jpg'),
  ('20250111_105324.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778474/snapshare/images/1794778449708-153206836-20250111_105324_sqbots.jpg'),
  ('20250111_105413.jpg', 'https://res.cloudinary.com/djgcvo5vm/image/upload/v1794778477/snapshare/images/1794778449802-918667217-20250111_105413_kmkuzh.jpg'),
]

for name, url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'SnapShare/1.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        img_bytes = resp.read()
    img_bgr = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    res85 = detect_and_embed_faces(img_bgr, conf_threshold=0.85)
    res70 = detect_and_embed_faces(img_bgr, conf_threshold=0.70)
    res50 = detect_and_embed_faces(img_bgr, conf_threshold=0.50)
    c85 = res85['faceCount']
    c70 = res70['faceCount']
    c50 = res50['faceCount']
    print(f"{name.ljust(22)} | Shape: {img_bgr.shape[1]}x{img_bgr.shape[0]} | Conf 0.85: {c85} | Conf 0.70: {c70} | Conf 0.50: {c50}")
