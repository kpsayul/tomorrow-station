"""Make reviewable distribution archives from explicit, non-secret assets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
game_files = ['index.html', 'style.css', 'favicon.svg', 'privacy.html', 'analytics-config.js', 'analytics.js', 'share.js', 'game-ui.js', 'game.js', 'chapter-two.js', 'chapter-three.js', 'chapter-four.js', 'chapter-five.js']
promo_files = ['og-cover.png', 'itch-cover.png', 'scene-station.png', 'scene-talking-cat.png', 'scene-rooftop.png', 'tomorrow-station-15s.mp4']

with ZipFile(root / 'media/tomorrow-station-itch.zip', 'w', ZIP_DEFLATED) as archive:
    for name in game_files:
        data = (root / name).read_bytes()
        if name == 'analytics-config.js':
            data = b"window.TOMORROW_ANALYTICS={measurementId:''};\n"
        if name == 'index.html':
            data = data.decode('utf-8-sig').replace('href="promo/"', 'href="https://kpsayul.github.io/tomorrow-station/promo/" target="_blank" rel="noopener"').encode('utf-8')
        archive.writestr(name, data)
    archive.write(root / 'media/og-cover.png', 'media/og-cover.png')
with ZipFile(root / 'media/tomorrow-station-promo.zip', 'w', ZIP_DEFLATED) as archive:
    for name in promo_files:
        archive.write(root / 'media' / name, name)
    archive.write(root / 'promo/POSTS.md', 'POSTS.md')
    archive.writestr('README.txt', '내일 분실물 보관소 홍보 자료\nhttps://kpsayul.github.io/tomorrow-station/\n\n게임 소개와 플레이 후기에 이미지·영상·문구를 사용할 수 있습니다.\n영상은 실제 게임 화면과 직접 합성한 짧은 음악을 담았습니다.\n'.encode('utf-8'))
for name in ['tomorrow-station-itch.zip', 'tomorrow-station-promo.zip']:
    with ZipFile(root / 'media' / name) as archive:
        assert archive.testzip() is None
        print(name, len(archive.namelist()), 'files', (root / 'media' / name).stat().st_size, 'bytes')
