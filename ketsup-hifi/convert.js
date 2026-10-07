// Lo-fi -> Hi-fi converter body for use_figma (maps to KETSUP tokens). Inputs: IDS (array of [srcId,name,x,y]).
const TARGET="97:471";
const target=await figma.getNodeByIdAsync(TARGET); await figma.setCurrentPageAsync(target);
const vars=await figma.variables.getLocalVariablesAsync(); const V={}; for(const v of vars) V[v.name]=v;
const tstyles=await figma.getLocalTextStylesAsync(); const TS={}; for(const s of tstyles) TS[s.name]=s;
const estyles=await figma.getLocalEffectStylesAsync(); const ES={}; for(const s of estyles) ES[s.name]=s;
for(const w of ["Regular","Medium","SemiBold","Bold"]) await figma.loadFontAsync({family:"Pretendard",style:w});
const hx=c=>[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
const FILLMAP={"1459f2":"Primary/Default","155eef":"Primary/Default","edf2ff":"Primary/Surface","e8f2ff":"Primary/Surface","eaf1ff":"Primary/Surface","1a2130":"Neutral/Ink","636e80":"Neutral/Body","59667d":"Neutral/Body","6b7891":"Neutral/Muted","7e869e":"Neutral/Muted","c7c7cc":"Neutral/MutedSoft","ffffff":"Neutral/Canvas","f7f9fb":"Neutral/SurfaceSoft","f5f7fa":"Neutral/SurfaceSoft","d6deeb":"Neutral/Hairline","c9d6eb":"Neutral/BorderStrong","d1d9e5":"Neutral/Hairline","e3e8f0":"Neutral/Hairline","e5faf0":"Semantic/SuccessSurface","e8faf2":"Semantic/SuccessSurface","fff5e3":"Category/OrangeSurface","fff5db":"Assessment/CautionSurface","bf6b08":"Category/OrangeText","d93a3a":"Semantic/Danger","ffecec":"Semantic/DangerSurface","222222":"Neutral/Ink","33363f":"Neutral/Ink"};
const TEXTMAP=Object.assign({},FILLMAP,{"ffffff":"Neutral/TextInverse","d6deeb":"Neutral/MutedSoft"});
const RMAP={4:"r-xs",8:"r-sm",11:"r-md",12:"r-md",13:"r-md",14:"r-md",16:"r-lg",20:"r-xl",24:"r-xl",999:"r-full"};
const TSTYLE={"28|Bold":"Display/XL","26|Bold":"Display/XL","24|Bold":"Display/XL","20|SemiBold":"Display/MD","20|Bold":"Display/MD","18|SemiBold":"Display/SM","18|Bold":"Display/SM","16|Bold":"Title/MD","16|SemiBold":"Title/MD","15|Medium":"Body/MD","15|Regular":"Body/MD","15|Bold":"Button/MD","15|SemiBold":"Button/MD","14|SemiBold":"Button/SM","14|Bold":"Button/SM","13|Regular":"Body/SM","13|Medium":"Body/SM","13|SemiBold":"Badge","13|Bold":"Badge","12|Medium":"Caption","12|Regular":"Caption","12|SemiBold":"Caption","12|Bold":"Caption"};
const unmapped={};
const bindPaint=(p,name)=>{const v=V["Colors/"+name]; if(!v) return p; return figma.variables.setBoundVariableForPaint({type:"SOLID",color:p.color,opacity:p.opacity,visible:p.visible},"color",v);};
function remap(paints,isText,isStroke){ if(!Array.isArray(paints)) return null; let ch=false; const out=paints.map(p=>{ if(p.type!=="SOLID"||p.boundVariables?.color) return p; const k=hx(p.color); const nm=(isText?TEXTMAP:FILLMAP)[k]; if(!nm){unmapped[k]=(unmapped[k]||0)+1; return p;} ch=true; return bindPaint(p,nm);}); return ch?out:null; }
const result=[];
for(const [srcId,name,x,y] of IDS){
  const src=await figma.getNodeByIdAsync(srcId); const root=src.clone(); target.appendChild(root); root.x=x; root.y=y; root.name=name+" · Hi-fi";
  const nodes=[root,...root.findAll(()=>true)]; let n=0;
  for(const nd of nodes){
    const isText=nd.type==="TEXT";
    if("fills" in nd && nd.fills!==figma.mixed){ const r=remap(nd.fills,isText,false); if(r) nd.fills=r; }
    if("strokes" in nd && nd.strokes.length){ const r=remap(nd.strokes,false,true); if(r) nd.strokes=r; }
    if("cornerRadius" in nd && typeof nd.cornerRadius==="number" && nd.type!=="ELLIPSE"){ const rv=RMAP[nd.cornerRadius]; if(rv&&V[rv]){ try{ for(const f of ["topLeftRadius","topRightRadius","bottomLeftRadius","bottomRightRadius"]) nd.setBoundVariable(f,V[rv]); }catch(e){} } }
    if(isText){
      const fn=nd.fontName;
      if(fn!==figma.mixed){ let w=fn.style.replace(/\s/g,""); if(!["Regular","Medium","SemiBold","Bold"].includes(w)) w=/Black|Extra/.test(w)?"Bold":/Light|Thin/.test(w)?"Regular":"Regular"; const sz=nd.fontSize; const sn=sz!==figma.mixed&&TSTYLE[sz+"|"+w]; if(sn&&TS["Type/"+sn]) await nd.setTextStyleIdAsync(TS["Type/"+sn].id); else nd.fontName={family:"Pretendard",style:w}; }
      else { for(const seg of nd.getStyledTextSegments(["fontName","start","end"])){ let w=seg.fontName.style.replace(/\s/g,""); if(!["Regular","Medium","SemiBold","Bold"].includes(w)) w="Regular"; nd.setRangeFontName(seg.start,seg.end,{family:"Pretendard",style:w}); } }
    }
    n++;
  }
  // elevation: white bordered cards
  for(const nd of root.findAll(x=>x.type==="FRAME"&&x.width>=150&&x.height>=48&&x.strokes.length>0&&typeof x.cornerRadius==="number"&&x.cornerRadius>=12&&x.fills!==figma.mixed&&x.fills.some(f=>f.type==="SOLID"&&hx(f.color)==="ffffff"||f.boundVariables?.color))) { await nd.setEffectStyleIdAsync(ES["Elevation/Surface/Subtle"].id); }
  result.push({id:root.id,name,n});
}
return {result,unmapped};
