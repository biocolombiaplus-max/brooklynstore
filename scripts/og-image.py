# Genera public/og-image.jpg (vista previa al compartir el link).
# Requiere Pillow y las fuentes de @fontsource/montserrat y @fontsource/playfair-display
# descomprimidas en /tmp/fonts (npm pack ... && tar xzf ...). Ejecutar desde la raíz del repo.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
S=2; W,H=1200*S,630*S
F='/tmp/fonts/'
mont=lambda w,s: ImageFont.truetype(F+f'fontsource-montserrat-5.3.0/files/montserrat-latin-{w}-normal.woff', s*S)
play=lambda s: ImageFont.truetype(F+'fontsource-playfair-display-5.3.0/files/playfair-display-latin-500-italic.woff', s*S)
GOLD_L=(241,220,154); GOLD=(201,166,70); GOLD_D=(140,106,34)

# fondo negro con halo dorado central
bg=Image.new('RGB',(W,H),(7,7,7))
glow=Image.new('L',(W,H),0); g=ImageDraw.Draw(glow)
g.ellipse((W*0.18,H*0.02,W*0.82,H*0.86),fill=120)
glow=glow.filter(ImageFilter.GaussianBlur(170*S))
gold=Image.new('RGB',(W,H),(120,92,30))
bg=Image.composite(gold,bg,glow)
# viñeta
vig=Image.new('L',(W,H),0); v=ImageDraw.Draw(vig)
v.rectangle((0,0,W,H),fill=255); v.ellipse((-W*0.15,-H*0.35,W*1.15,H*1.35),fill=0)
vig=vig.filter(ImageFilter.GaussianBlur(120*S))
bg=Image.composite(Image.new('RGB',(W,H),(0,0,0)),bg,vig.point(lambda p:int(p*0.8)))
img=bg.convert('RGBA'); d=ImageDraw.Draw(img)

def gold_text(text,font,cx,y,track=0,grad=True):
    # texto con degradado dorado vertical y espaciado entre letras
    widths=[font.getlength(c) for c in text]
    total=sum(widths)+track*S*(len(text)-1)
    asc,desc=font.getmetrics(); h=asc+desc
    m=Image.new('L',(int(total)+4,h),0); md=ImageDraw.Draw(m); x=0
    for c,wc in zip(text,widths): md.text((x,0),c,font=font,fill=255); x+=wc+track*S
    if grad:
        fill=Image.new('RGB',m.size)
        for yy in range(h):
            t=yy/max(1,h-1)
            c=[int(GOLD_L[i]*(1-t)+GOLD_D[i]*t) if t<1 else GOLD_D[i] for i in range(3)]
            if t<0.5: c=[int(GOLD_L[i]*(1-t*2)+GOLD[i]*t*2) for i in range(3)]
            else: c=[int(GOLD[i]*(1-(t-0.5)*2)+GOLD_D[i]*(t-0.5)*2) for i in range(3)]
            ImageDraw.Draw(fill).line((0,yy,m.size[0],yy),fill=tuple(c))
    else: fill=Image.new('RGB',m.size,grad if isinstance(grad,tuple) else (255,255,255))
    img.paste(fill,(int(cx-total/2),int(y)),m)
    return total

def plain_text(text,font,cx,y,color,track=0):
    widths=[font.getlength(c) for c in text]; total=sum(widths)+track*S*(len(text)-1); x=cx-total/2
    for c,wc in zip(text,widths): d.text((x,y),c,font=font,fill=color); x+=wc+track*S
    return total

# marco dorado fino
inset=26*S
d.rounded_rectangle((inset,inset,W-inset,H-inset),radius=18*S,outline=GOLD+(150,),width=1*S)
# esquinas
for (x,y,sx,sy) in [(inset,inset,1,1),(W-inset,inset,-1,1),(inset,H-inset,1,-1),(W-inset,H-inset,-1,-1)]:
    d.line((x+sx*10*S,y+sy*10*S,x+sx*46*S,y+sy*10*S),fill=GOLD_L+(230,),width=2*S)
    d.line((x+sx*10*S,y+sy*10*S,x+sx*10*S,y+sy*46*S),fill=GOLD_L+(230,),width=2*S)

# logo con sombra suave
logo=Image.open('public/logo.png').convert('RGBA')
lw=500*S; lh=int(logo.height*lw/logo.width); logo=logo.resize((lw,lh),Image.LANCZOS)
lx=(W-lw)//2+12*S; ly=70*S
sh=Image.new('RGBA',img.size,(0,0,0,0)); sh.paste((0,0,0,200),(lx,ly+10*S),logo.split()[3])
img=Image.alpha_composite(img,sh.filter(ImageFilter.GaussianBlur(14*S)))
img.alpha_composite(logo,(lx,ly)); d=ImageDraw.Draw(img)

# línea con rombo
y=ly+lh+26*S; cx=W//2
d.line((cx-150*S,y,cx-16*S,y),fill=GOLD+(255,),width=1*S); d.line((cx+16*S,y,cx+150*S,y),fill=GOLD+(255,),width=1*S)
d.polygon([(cx,y-7*S),(cx+7*S,y),(cx,y+7*S),(cx-7*S,y)],fill=GOLD_L)

# titulares
plain_text('TIENDA DE ZAPATOS MULTIMARCA',mont(800,30),cx,y+28*S,(255,255,255),track=5)
gold_text('Envío a todo Ecuador  ·  Paga al recibir',play(31),cx,y+80*S)

# sellos inferiores
labels=['COMPRA SEGURA','CONTRA ENTREGA','ENVÍO 24–72 H']
f=mont(700 if False else 600,15)
ys=H-inset-82*S
widths=[f.getlength(l)+2.2*S*len(l)+44*S for l in labels]; gap=16*S
x=cx-(sum(widths)+gap*(len(labels)-1))/2
layer=Image.new('RGBA',img.size,(0,0,0,0)); ld=ImageDraw.Draw(layer); xs=[]
for l,wid in zip(labels,widths):
    ld.rounded_rectangle((x,ys,x+wid,ys+40*S),radius=20*S,outline=GOLD+(210,),width=1*S,fill=(255,255,255,14))
    xs.append(x); x+=wid+gap
img=Image.alpha_composite(img,layer); d=ImageDraw.Draw(img)
for l,wid,x0 in zip(labels,widths,xs):
    plain_text(l,f,x0+wid/2,ys+11*S,GOLD_L,track=2.2)
plain_text('ON  ·  NIKE  ·  ADIDAS  ·  NEW BALANCE  ·  PUMA  ·  CONVERSE  ·  VANS',mont(600,12),cx,H-inset-30*S,(150,142,125),track=3)

out=img.convert('RGB').resize((1200,630),Image.LANCZOS)
out.save('public/og-image.jpg',quality=90,optimize=True,progressive=True)
# versión cuadrada (logo) para plataformas que usan miniatura cuadrada
sq=out.crop((285,0,915,630)); sq.save('/tmp/og-square-preview.jpg',quality=88)
print('ok')
