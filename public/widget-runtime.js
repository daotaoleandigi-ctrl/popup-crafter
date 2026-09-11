(function(){
"use strict";
function dec(s){try{return JSON.parse(decodeURIComponent(escape(atob(s))))}catch(e){try{return JSON.parse(atob(s))}catch(e2){return null}}}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function pickVoucher(vouchers){
  var eligible=(vouchers||[]).filter(function(v){return Number(v.probability)>0}),total=eligible.reduce(function(sum,v){return sum+Number(v.probability)},0);
  if(!eligible.length||total<=0)return vouchers&&vouchers[0];
  var cursor=Math.random()*total;
  for(var i=0;i<eligible.length;i++){cursor-=Number(eligible[i].probability);if(cursor<0)return eligible[i];}
  return eligible[eligible.length-1];
}
function applyVoucher(config){
  if(!config.voucherRandomEnabled||!config.vouchers||!config.vouchers.length)return config;
  var key="popup-crafter:voucher:"+(config.id||"default"),selected=null;
  try{var saved=sessionStorage.getItem(key);if(saved)selected=config.vouchers.find(function(v){return v.id===saved});}catch(e){}
  if(!selected)selected=pickVoucher(config.vouchers);
  if(!selected)return config;
  try{sessionStorage.setItem(key,selected.id);}catch(e){}
  var merged={};for(var k in config)merged[k]=config[k];
  ["rewardText","rewardSubtitle","rewardImage","rewardTextColor","rewardSubtitleColor"].forEach(function(k){if(selected[k]!=null)merged[k]=selected[k];});
  merged.selectedVoucherId=selected.id;merged.voucherCode=selected.code||"";
  return merged;
}
function styles(c,mode){
  mode=mode||"popup";
  var r=c.borderRadius||16,mw=c.maxWidth||880;
  var cb=c.closeStyle==="text"?"padding:2px 8px;border-radius:6px;font-size:14px;font-weight:600;":c.closeStyle==="square"?"height:32px;width:32px;border-radius:6px;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:700;":"height:32px;width:32px;border-radius:9999px;font-size:18px;display:flex;align-items:center;justify-content:center;font-weight:700;";
  var overlay=mode==="embed"?".pb-overlay{display:block}":".pb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;animation:pbFade .25s ease}";
  var claimBg=c.claimButtonGradient?"linear-gradient(135deg,"+esc(c.claimButtonColor||"#7c3aed")+","+esc(c.claimButtonColor2||"#a78bfa")+")":esc(c.claimButtonColor||"#7c3aed");
var responsive=".pb-root,.pb-root *{box-sizing:border-box;min-width:0}.pb-root{overflow-wrap:anywhere}.pb-scratch-wrap{max-width:100%;height:auto!important;aspect-ratio:3/2}.pb-left{min-width:0}.pb-form-box iframe{max-width:100%}"+(mode==="popup"?".pb-root{max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain}":"");
return "<style>:host{all:initial}"+overlay+(mode==="popup"?"@keyframes pbFade{from{opacity:0}to{opacity:1}}":"")+"@keyframes pbPop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}.pb-root{position:relative;width:100%;max-width:"+mw+"px;background:"+esc(c.bgColor||"#fff")+";border-radius:"+r+"px;overflow:hidden;box-shadow:0 25px 60px -15px rgba(0,0,0,.5);font-family:"+esc(c.fontFamily||"system-ui,sans-serif")+";display:grid;grid-template-columns:1fr 1fr;min-height:420px;animation:pbPop .3s ease}.pb-close{position:absolute;top:12px;right:12px;z-index:30;cursor:pointer;border:0;color:"+esc(c.closeColor||"#fff")+";background:"+esc(c.closeBgColor||"rgba(0,0,0,.45)")+";"+cb+"}.pb-close:hover{opacity:.8}.pb-left{position:relative;display:flex;flex-direction:column;padding:24px}.pb-right{position:relative;overflow:hidden;background:#f1f5f9;min-height:420px}.pb-right img{width:100%;height:100%;object-fit:"+esc(c.bannerFit||"cover")+";object-position:"+esc(c.bannerPosition||"center")+"}.pb-banner-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#fff;background:linear-gradient(135deg,#7c3aed,#a78bfa);text-align:center;padding:24px}.pb-step{display:none;flex-direction:column;flex:1;align-items:center;justify-content:center;gap:16px}.pb-left[data-step='1'] .pb-step-1,.pb-left[data-step='2'] .pb-step-2,.pb-left[data-step='3'] .pb-step-3{display:flex}.pb-title{font-size:20px;font-weight:800;text-align:center;margin:0;color:"+esc(c.scratchTitleColor||"#1e293b")+"}.pb-hint{font-size:12px;color:#64748b;text-align:center;max-width:280px;margin:0}.pb-claim{display:none;flex-direction:column;align-items:center;gap:8px}.pb-claim-btn{border:0;cursor:pointer;border-radius:12px;padding:12px 28px;font-size:15px;font-weight:700;color:"+esc(c.claimButtonTextColor||"#fff")+";background:"+claimBg+";box-shadow:0 8px 16px -4px rgba(0,0,0,.25)}.pb-claim-btn:hover{opacity:.92}.pb-decline-btn{border:0;background:transparent;cursor:pointer;font-size:12px;color:#64748b;text-decoration:underline;text-underline-offset:2px}.pb-decline-btn:hover{color:#1e293b}.pb-scratch-wrap{position:relative;width:300px;height:200px;border-radius:12px;overflow:hidden;background:#f1f5f9}.pb-reward{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0 16px;text-align:center}.pb-reward img{width:100%;height:100%;object-fit:cover}.pb-reward-subtitle{font-weight:600;color:"+esc(c.rewardSubtitleColor||"#64748b")+";font-size:"+(c.rewardSubtitleFontSize||13)+"px;font-family:"+esc(c.rewardSubtitleFontFamily||"system-ui,sans-serif")+"}.pb-reward-text{font-size:"+(c.rewardTextFontSize||18)+"px;font-weight:800;color:"+esc(c.rewardTextColor||"#0f172a")+";font-family:"+esc(c.rewardTextFontFamily||"system-ui,sans-serif")+";display:flex;align-items:center;justify-content:center;gap:6px}.pb-reward-line{white-space:pre-wrap;line-height:1.3}.pb-ico{line-height:1}.pb-scratch{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}.pb-form-title{font-size:16px;font-weight:700;margin:0 0 12px;color:"+esc(c.scratchTitleColor||"#1e293b")+"}.pb-form-box{flex:1;overflow:auto;padding:8px;min-height:240px}.pb-thanks{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}.pb-thanks-badge{height:56px;width:56px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;background:linear-gradient(135deg,#fbbf24,#7c3aed);box-shadow:0 10px 20px -5px rgba(0,0,0,.3)}.pb-thanks-title{font-size:20px;font-weight:800;margin:0;color:"+esc(c.thanksTextColor||"#0f172a")+";font-family:"+esc(c.thanksFontFamily||"system-ui,sans-serif")+"}.pb-thanks-msg{font-size:14px;margin:0;max-width:260px;color:"+esc(c.thanksTextColor||"#0f172a")+";font-family:"+esc(c.thanksFontFamily||"system-ui,sans-serif")+"}.pb-thanks-btn{margin-top:8px;border:0;cursor:pointer;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:600;color:#fff;background:linear-gradient(135deg,#7c3aed,#a78bfa);box-shadow:0 8px 16px -4px rgba(124,58,237,.5);font-family:"+esc(c.thanksFontFamily||"system-ui,sans-serif")+"}.pb-confetti{position:absolute;inset:0;pointer-events:none;z-index:50}@media(max-width:640px){.pb-root{grid-template-columns:1fr}.pb-right{min-height:160px;height:160px}.pb-scratch-wrap{width:260px;height:170px}}"+responsive+"</style>";
}
function markup(c,mode){
  mode=mode||"popup";
  var banner=c.bannerImage?'<img src="'+esc(c.bannerImage)+'" alt="Banner">':'<div class="pb-banner-placeholder"><span style="font-size:30px">\u{1F381}</span><span style="font-size:14px;font-weight:600;opacity:.9">Banner</span></div>';
var ib=c.rewardIconBefore?esc(c.rewardIconBefore):"",ia=c.rewardIconAfter?esc(c.rewardIconAfter):"";
  var sub=c.rewardSubtitle?'<div class="pb-reward-subtitle">'+esc(c.rewardSubtitle).replace(/\\n/g,"<br>")+'</div>':'';
  var code=c.voucherCode?'<div style="margin-top:8px;border:1px dashed currentColor;border-radius:6px;padding:4px 8px;font:700 12px monospace;letter-spacing:.08em">'+esc(c.voucherCode)+'</div>':'';
  var reward=c.rewardImage?'<div class="pb-reward"><img src="'+esc(c.rewardImage)+'" alt="reward">'+code+'</div>':'<div class="pb-reward">'+sub+'<div class="pb-reward-text">'+(ib?'<span class="pb-ico">'+ib+'</span>':'')+'<span class="pb-reward-line">'+esc(c.rewardText||"Ph\u1EA7n th\u01B0\u1EDFng").replace(/\\n/g,"<br>")+'</span>'+(ia?'<span class="pb-ico">'+ia+'</span>':'')+'</div>'+code+'</div>';
  var formInner=c.formEmbedCode?"":'<div style="display:flex;height:100%;align-items:center;justify-content:center;text-align:center;font-size:12px;color:#94a3b8">Form s\u1EBD hi\u1EC3n th\u1ECB t\u1EA1i \u0111\xE2y</div>';
  var closeBtn=mode==="popup"?'<button class="pb-close" aria-label="\u0110\xF3ng">'+(c.closeStyle==="text"?"\u0110\xF3ng \u00D7":"\u00D7")+'</button>':"";
  var declineBtn=c.showDeclineButton===false?"":'<button class="pb-decline-btn">'+esc(c.declineButtonLabel||"Kh\xF4ng, c\u1EA3m \u01A1n")+'</button>';
  return '<div class="pb-overlay"><div class="pb-root">'+closeBtn+'<div class="pb-left" data-step="1"><canvas class="pb-confetti"></canvas><div class="pb-step pb-step-1"><h2 class="pb-title">'+esc(c.scratchTitle||"C\xE0o qu\xE0 ngay!")+'</h2><div class="pb-scratch-wrap">'+reward+'<canvas class="pb-scratch"></canvas></div><p class="pb-hint">'+esc(c.scratchHint||"C\xE0o l\xEAn th\u1EBB \u0111\u1EC3 m\u1EDF qu\xE0")+'</p><div class="pb-claim"><button class="pb-claim-btn">'+esc(c.claimButtonLabel||"Nh\u1EADn qu\xE0 ngay!")+'</button>'+declineBtn+'</div></div><div class="pb-step pb-step-2" style="align-items:stretch"><h3 class="pb-form-title">'+esc(c.formTitle||"\u0110i\u1EC1n th\xF4ng tin \u0111\u1EC3 nh\u1EADn qu\xE0")+'</h3><div class="pb-form-box">'+formInner+'</div></div><div class="pb-step pb-step-3"><div class="pb-thanks"><div class="pb-thanks-badge">\u2713</div><h3 class="pb-thanks-title">'+esc(c.thanksTitle||"Ch\xFAc m\u1EEBng b\u1EA1n!")+'</h3><p class="pb-thanks-msg">'+esc(c.thanksMessage||"Ph\u1EA7n qu\xE0 \u0111\xE3 \u0111\u01B0\u1EE3c g\u1EEDi v\u1EC1 email c\u1EE7a b\u1EA1n.")+'</p><button class="pb-thanks-btn">'+esc(c.thanksButtonLabel||"\u0110\xF3ng")+'</button></div></div></div><div class="pb-right">'+banner+'</div></div></div>';
}
function initScratch(canvas,surface,config,onComplete){
  var W=canvas.width=300,H=canvas.height=200,ctx=canvas.getContext("2d");
  function fillDefault(){var g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#a78bfa");g.addColorStop(1,"#7c3aed");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle="rgba(255,255,255,0.95)";ctx.font="bold 16px sans-serif";ctx.textAlign="center";ctx.fillText("C\xC0O \u0110\u1EC2 NH\u1EACN QU\xC0",W/2,H/2);}
  if(config.scratchCoverImage){var img=new Image();img.crossOrigin="anonymous";img.onload=function(){ctx.drawImage(img,0,0,W,H)};img.onerror=fillDefault;img.src=config.scratchCoverImage;}else{fillDefault();}
  var drawing=false,last=null,lastCheck=0;
  function rect(cx,cy){var r=canvas.getBoundingClientRect();return{x:(cx-r.left)*(W/r.width),y:(cy-r.top)*(H/r.height)};}
  function clamp(x,y){return{x:Math.max(0,Math.min(W,x)),y:Math.max(0,Math.min(H,y))};}
  function scratch(x,y){ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fill();if(last){ctx.lineWidth=40;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(x,y);ctx.stroke();}last={x:x,y:y};}
  function check(){try{var d=ctx.getImageData(0,0,W,H).data,cl=0,t=0;for(var i=3;i<d.length;i+=32){t++;if(d[i]===0)cl++;}if(cl/t>=(config.scratchPercent||50)/100)onComplete();}catch(e){}}
  surface.addEventListener("pointerdown",function(e){drawing=true;last=null;lastCheck=0;var co=rect(e.clientX,e.clientY),p=clamp(co.x,co.y);scratch(p.x,p.y);});
  window.addEventListener("pointermove",function(e){if(!drawing)return;var co=rect(e.clientX,e.clientY),p=clamp(co.x,co.y);scratch(p.x,p.y);var now=performance.now();if(now-lastCheck>80){lastCheck=now;check();}});
  function end(){if(drawing){drawing=false;check();}}
  window.addEventListener("pointerup",end);window.addEventListener("pointercancel",end);
}
function fireConfetti(canvas,originEl){
  if(!canvas)return;
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;";
  document.body.appendChild(canvas);
  var ctx=canvas.getContext("2d"),W=canvas.width=window.innerWidth,H=canvas.height=window.innerHeight;
  var ox=W/2,oy=H/2;
  if(originEl){var r=originEl.getBoundingClientRect();ox=r.left+r.width/2;oy=r.top+r.height/2;}
  var colors=["#7c3aed","#a78bfa","#fbbf24","#f59e0b","#ec4899","#34d399"],P=[];
  for(var i=0;i<140;i++){P.push({x:ox+(Math.random()-.5)*60,y:oy+(Math.random()-.5)*30,r:4+Math.random()*6,c:colors[(Math.random()*colors.length)|0],vx:(Math.random()-.5)*12,vy:-Math.random()*9-4,rot:Math.random()*6,vr:(Math.random()-.5)*.3});}
  var start=performance.now();
  function tick(t){var el=t-start;ctx.clearRect(0,0,W,H);P.forEach(function(p){p.vy+=.2;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;var life=Math.max(0,1-el/1800);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=life;ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();});if(el<1900)requestAnimationFrame(tick);else{ctx.clearRect(0,0,W,H);canvas.remove();}}
  requestAnimationFrame(tick);
}
function watchForm(box,onDone){
  if(!box)return function(){};
  var done=false;function fire(){if(!done){done=true;onDone();}}
  var armed=false;setTimeout(function(){armed=true;},1500);
  var iframes=box.querySelectorAll("iframe");
  if(iframes.length){Array.prototype.forEach.call(iframes,function(f){f.addEventListener("load",function(){if(armed)fire();});});}
  var kw=/(thank|cảm ơn|cam on|success|thành công|thanh cong|đã gửi|da gui|submitted|complete|hoàn tất|hoan tat)/i;
  var ob=new MutationObserver(function(){var forms=box.querySelectorAll("form");if(!forms.length&&kw.test(box.textContent||""))fire();});
  ob.observe(box,{childList:true,subtree:true,characterData:true});
  return function(){ob.disconnect();};
}
function bindSteps(shadow,host,config,mode,visitState){
  visitState=visitState||{completed:false};
  var completed=visitState.completed;
  var leftCol=shadow.querySelector(".pb-left"),step=1,autoCloseTimer=null;
  var useBubble=mode==="popup"&&config.bubbleEnabled!==false;
  var bubbleEl=null;
  function createBubble(){
    if(!useBubble)return null;
    var b=document.createElement("div");
    b.className="scratch-popup-bubble";
    var size=config.bubbleSize||60;
    var isRight=config.bubblePosition==="bottom-right"||config.bubblePosition==="top-right";
    var isTop=config.bubblePosition==="top-left"||config.bubblePosition==="top-right";
    var pos=isRight?"right":"left";
    var vert=isTop?"top":"bottom";
    var label=config.bubbleText||"Nh\u1EADn qu\xE0";
    b.style.cssText=
      "position:fixed;z-index:2147483646;"+vert+":24px;"+pos+":24px;"+
      "cursor:pointer;"+
      "transition:transform .2s ease;"+
      "animation:pbBounceIn .35s ease;user-select:none;-webkit-user-select:none;";
b.innerHTML='<div style="display:flex;align-items:center;justify-content:center;width:'+size+'px;height:'+size+'px;border-radius:9999px;background:'+esc(config.bubbleBgColor||"#7c3aed")+';color:'+esc(config.bubbleTextColor||"#fff")+';font-size:'+Math.max(16,size*0.32)+'px;box-shadow:0 8px 28px -8px rgba(0,0,0,.4);">\u{1F381}</div><span class="pb-bubble-label" style="position:absolute;top:50%;'+(pos==="right"?"right:100%;margin-right:8px;":"left:100%;margin-left:8px;")+'transform:translateY(-50%) translateX('+(pos==="right"?"8px":"-8px")+');opacity:0;white-space:nowrap;background:'+esc(config.bubbleBgColor||"#7c3aed")+';color:'+esc(config.bubbleTextColor||"#fff")+';font-size:'+(config.bubbleFontSize||14)+'px;font-family:'+esc(config.bubbleFontFamily||config.fontFamily||"system-ui,sans-serif")+';font-weight:600;padding:6px 14px;border-radius:9999px;box-shadow:0 8px 20px -6px rgba(0,0,0,.4);pointer-events:none;transition:opacity .25s ease,transform .25s ease;">'+esc(label)+'</span>';
    var labelEl=b.querySelector(".pb-bubble-label");
    function expand(){b.style.transform="scale(1.06)";if(labelEl){labelEl.style.opacity="1";labelEl.style.transform="translateY(-50%) translateX(0px)";}}
    function collapse(){b.style.transform="";if(labelEl){labelEl.style.opacity="0";labelEl.style.transform="translateY(-50%) translateX("+(pos==="right"?"8px":"-8px")+")";}}
    b.addEventListener("mouseenter",expand);
    b.addEventListener("mouseleave",collapse);
    b.addEventListener("focus",expand);
    b.addEventListener("blur",collapse);
    if(!document.getElementById("pb-bubble-styles")){
      var s=document.createElement("style");s.id="pb-bubble-styles";
      s.textContent="@keyframes pbBounceIn{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}";
      document.head.appendChild(s);
    }
    return b;
  }
  function showBubble(){
    if(!bubbleEl)bubbleEl=createBubble();
    if(bubbleEl&&!document.body.contains(bubbleEl))document.body.appendChild(bubbleEl);
    host.style.display="none";
  }
  function hideBubble(){
    if(bubbleEl&&document.body.contains(bubbleEl))bubbleEl.remove();
    host.style.display="";
  }
  function close(){
    if(useBubble){showBubble();}
    else{host.remove();}
    if(autoCloseTimer)clearTimeout(autoCloseTimer);
  }
  var closeBtn=shadow.querySelector(".pb-close");
  var overlayEl=shadow.querySelector(".pb-overlay");
  if(closeBtn&&mode==="popup")closeBtn.addEventListener("click",close);
  if(overlayEl&&mode==="popup")overlayEl.addEventListener("click",function(e){if(e.target===overlayEl)close();});
  function setStep(s){step=s;if(leftCol)leftCol.dataset.step=String(s);if(s===3&&mode==="popup"){autoCloseTimer=setTimeout(close,5000);}}
  var scratchCanvas=shadow.querySelector(".pb-scratch"),confettiCanvas=shadow.querySelector(".pb-confetti");
  if(scratchCanvas&&completed){scratchCanvas.style.display="none";var savedClaim=shadow.querySelector(".pb-claim"),savedHint=shadow.querySelector(".pb-hint");if(savedHint)savedHint.style.display="none";if(savedClaim)savedClaim.style.display="flex";}
  else if(scratchCanvas){var step1=shadow.querySelector(".pb-step-1");if(step1){step1.style.touchAction="none";step1.style.cursor="grab";}initScratch(scratchCanvas,step1||scratchCanvas,config,function(){if(completed)return;completed=true;visitState.completed=true;fireConfetti(confettiCanvas,shadow.querySelector(".pb-scratch-wrap"));var ctx=scratchCanvas.getContext("2d");ctx.clearRect(0,0,scratchCanvas.width,scratchCanvas.height);var claim=shadow.querySelector(".pb-claim"),hint=shadow.querySelector(".pb-hint");if(hint)hint.style.display="none";if(claim)claim.style.display="flex";});}
  var claimBtn=shadow.querySelector(".pb-claim-btn"),declineBtn=shadow.querySelector(".pb-decline-btn");
  if(claimBtn)claimBtn.addEventListener("click",function(){setStep(2);});
  if(declineBtn&&mode==="popup")declineBtn.addEventListener("click",function(){if(useBubble)showBubble();else close();});
  var thanksBtn=shadow.querySelector(".pb-thanks-btn");
  if(thanksBtn&&mode==="popup")thanksBtn.addEventListener("click",close);
  var onMessage=function(e){var d=e.data;if(!d)return;if(d.event==="form:submit"||d.type==="ghl_form_submit"||d.submitted===true){if(step===2)setStep(3);}};
  window.addEventListener("message",onMessage);
  var formBox=shadow.querySelector(".pb-form-box");
  var formCleanup=function(){};
  if(formBox&&config.formEmbedCode){formBox.innerHTML=config.formEmbedCode;formBox.querySelectorAll("script").forEach(function(old){var s=document.createElement("script");for(var i=0;i<old.attributes.length;i++){s.setAttribute(old.attributes[i].name,old.attributes[i].value);}s.textContent=old.textContent;old.replaceWith(s);});formCleanup=watchForm(formBox,function(){if(step===2)setStep(3);});}
  if(useBubble){
    document.addEventListener("click",function(e){
      var t=e.target;
      if(t.closest&&t.closest(".scratch-popup-bubble")){hideBubble();setStep(1);}
    },true);
  }
  return function(){window.removeEventListener("message",onMessage);formCleanup();if(autoCloseTimer)clearTimeout(autoCloseTimer);if(bubbleEl&&document.body.contains(bubbleEl))bubbleEl.remove();};
}
function mountPopup(config,visitState){
  var host=document.createElement("div");host.id="scratch-popup-"+(config.id||Math.random().toString(36).slice(2));host.style.cssText="all:initial;position:fixed;inset:0;z-index:2147483647;";document.body.appendChild(host);
  var shadow=host.attachShadow({mode:"open"});shadow.innerHTML=styles(config,"popup")+markup(config,"popup");
  var cleanup=bindSteps(shadow,host,config,"popup",visitState);
  return function(){cleanup();host.remove();};
}
// --- Bootstrap ------------------------------------------------------------
var me=document.currentScript;
var cfgB64=me&&me.getAttribute("data-config");
var config=cfgB64?dec(cfgB64):null;
if(!config)return;
config=applyVoucher(config);
if(config.displayMode==="embed"){var h=document.createElement("div");h.style.cssText="display:block;width:100%";me.parentNode.insertBefore(h,me);var sh=h.attachShadow({mode:"open"});sh.innerHTML=styles(config,"embed")+markup(config,"embed");bindSteps(sh,h,config,"embed",{completed:false});return;}
var activeCleanup=null;
var scratchVisitState={completed:false};
function openPopup(){if(activeCleanup)activeCleanup();activeCleanup=mountPopup(config,scratchVisitState);}
// Popup mode: overlay auto-opens on page load (with optional delay).
// Also exposes open() + click delegation for manual triggers.
window.ScratchPopup=window.ScratchPopup||{};
window.ScratchPopup.open=openPopup;
window.ScratchPopup.config=config;
document.addEventListener("click",function(e){
  var t=e.target;
  while(t&&t!==document){
    if(t.classList&&t.classList.contains("scratch-popup-trigger")){e.preventDefault();window.ScratchPopup.open();return;}
    if(t.dataset&&typeof t.dataset.scratchPopup!=="undefined"){e.preventDefault();window.ScratchPopup.open();return;}
    t=t.parentNode;
  }
});
var delay=(config.autoShowDelay||0)*1000;
function autoOpen(){openPopup();}
if(delay>0){setTimeout(autoOpen,delay);}
else if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",autoOpen);}
else{autoOpen();}
})();