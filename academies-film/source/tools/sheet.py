# contact sheet: python3 tools/sheet.py out.png cols scale files...
import sys; from PIL import Image, ImageDraw
out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]; w, h = int(ims[0].width*scale), int(ims[0].height*scale)
rows = (len(ims)+cols-1)//cols; sheet = Image.new('RGB', (cols*w+(cols-1)*6, rows*(h+22)), (30,30,30)); d = ImageDraw.Draw(sheet)
for i,(im,f) in enumerate(zip(ims,fs)):
    x, y = (i%cols)*(w+6), (i//cols)*(h+22); sheet.paste(im.resize((w,h), Image.LANCZOS), (x,y+20)); d.text((x+4,y+4), f.split('/')[-1], fill=(255,255,255))
sheet.save(out)
