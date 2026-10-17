"""Create review sheets from unedited browser screenshots; retain originals."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
base=Path(__file__).resolve().parents[1]
folder=base/'outputs/student-drag-v7'
manifest=json.loads((base/'verification/student-journey-manifest.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
for page in range((len(manifest)+5)//6):
    sheet=Image.new('RGB',(1280,1200),'#f4f4eb')
    draw=ImageDraw.Draw(sheet)
    for slot,item in enumerate(manifest[page*6:page*6+6]):
        x=(slot%2)*640;y=(slot//2)*400
        draw.text((x+10,y+6),f"{item['course']}/{item['id']} · {item['title']}",font=font,fill='#244732')
        path=folder/f"{item['course']}-{item['id']}-before.png"
        if path.exists():sheet.paste(Image.open(path).convert('RGB').resize((640,360)),(x,y+36))
    sheet.save(folder/f'contact-{page+1}.jpg',quality=90)
print('7 review sheets created')
