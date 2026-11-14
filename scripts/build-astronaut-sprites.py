"""Extract the four *unchanged drawn poses* from the user's astronaut JPG.
Only remove contiguous exterior white and package frames as an alpha PNG atlas.
"""
from PIL import Image
import numpy as np
from scipy.ndimage import binary_propagation, binary_dilation
from pathlib import Path
source = Path(__file__).resolve().parents[1] / 'public/assets/reference/astronat-original.jpg'
dst = Path(__file__).resolve().parents[1] / 'public/assets/astronaut-myanmar-4frames.png'
im = Image.open(source).convert('RGB')
assert im.size == (1024,572), im.size
# Deliberately isolate the characters; no redrawing, generated details or recoloring.
regions = [(15,78,254,474), (272,78,524,475), (531,78,770,474), (778,78,1018,480)]
frames=[]
for bbox in regions:
    crop = np.asarray(im.crop(bbox),dtype=np.uint8)
    high = crop.min(axis=2) >= 234
    low_chroma = (crop.max(axis=2).astype('int') - crop.min(axis=2).astype('int')) < 32
    removable = high & low_chroma
    seed = np.zeros(removable.shape, dtype=bool)
    seed[0,:]=removable[0,:];seed[-1,:]=removable[-1,:]
    seed[:,0]=removable[:,0];seed[:,-1]=removable[:,-1]
    exterior = binary_propagation(seed,mask=removable)
    # Avoid cutting white suit regions surrounded by the black pixel outlines.
    alpha=np.where(exterior,0,255).astype('uint8')
    near=~exterior & binary_dilation(exterior,iterations=1)
    # Very faint JPG border pixels: retain anti-alias without white rectangular halos.
    border_strength=np.maximum(0,(240-crop.min(axis=2).astype('int'))*5)
    alpha[near]=np.minimum(alpha[near],np.minimum(255,border_strength[near]).astype('uint8'))
    mask = alpha>30
    ys,xs=np.where(mask)
    x0,x1=max(0,xs.min()-3),min(crop.shape[1],xs.max()+4)
    y0,y1=max(0,ys.min()-3),min(crop.shape[0],ys.max()+4)
    rgba=np.dstack((crop,alpha))[y0:y1,x0:x1]
    cropimage=Image.fromarray(rgba,'RGBA')
    # Preserve exact poses; resize only for efficient delivery, without palette changes.
    cropimage.thumbnail((132,204),Image.Resampling.NEAREST)
    frames.append(cropimage)
W,H=144,210
atlas=Image.new('RGBA',(W*4,H),(0,0,0,0))
for idx,sprite in enumerate(frames):
    atlas.alpha_composite(sprite,(idx*W+(W-sprite.width)//2,H-sprite.height-2))
dst.parent.mkdir(parents=True,exist_ok=True)
atlas.save(dst,optimize=True)
print(dst,atlas.size,dst.stat().st_size)
