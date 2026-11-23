'use strict';

// No framework, account, runtime API, or build step is required by this site.
const $ = (selector) => document.querySelector(selector);
const header = $('.site-header');
const menuButton = $('.menu-toggle');
const menu = $('#mobile-menu');
const journey = $('.farm-journey');
function closeMenu() {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu +';
  header.classList.remove('site-header--open');
}
menuButton.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Zamknij ×' : 'Menu +';
  header.classList.toggle('site-header--open', open);
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); menuButton.focus(); } });
function updateHeader() { header.classList.toggle('site-header--solid', journey.getBoundingClientRect().bottom < header.offsetHeight); }
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

// Same single-film progression as the original journey, with coalesced seeking.
function setupJourney() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 860px)');
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)');
  let abort;
  let video;
  let blobUrl;
  let raf = 0;
  let source;
  let ready = false;
  let stopped = false;
  let current = 0;
  let target = 0;
  let top = 0;
  let distance = 1;
  const layer = $('[data-scroll-scrub-layer]');
  const clamp = n => Math.max(0, Math.min(1, n));
  const mobileSource = () => mobile.matches || coarse.matches;
  function layout() {
    top = journey.getBoundingClientRect().top + window.scrollY;
    // The full generated film resolves while the final story chapter is visible.
    distance = Math.max(journey.offsetHeight - window.innerHeight, 1);
    updateTarget();
  }
  function updateTarget() {
    const progress = clamp((window.scrollY - top) / distance);
    const centered = progress - .5;
    target = .85 * progress + .15 * 4 * centered ** 3 + .075;
    journey.style.setProperty('--ss-progress', String(progress));
  }
  function cleanupMedia() {
    abort?.abort();
    ready = false;
    if(video) {video.pause();video.remove();video.removeAttribute('src');video.load();video=null;}
    if(blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl=null;
    delete layer.dataset.videoPainted;
  }
  async function loadMedia() {
    cleanupMedia();
    if(reduce.matches || stopped) return;
    const src = mobileSource() ? './assets/world/scene-01-mobile.mp4' : './assets/world/scene-01.mp4';
    source = src;
    abort = new AbortController();
    const request = abort;
    try {
      const response = await fetch(new URL(src, document.baseURI), {signal:request.signal});
      if(!response.ok) throw new Error('Film unavailable');
      const blob = await response.blob();
      if(request.signal.aborted || stopped || source !== src || reduce.matches) return;
      blobUrl = URL.createObjectURL(blob);
      const player = document.createElement('video');
      video = player;
      player.className='scroll-scrub__video';player.muted=true;player.playsInline=true;player.preload='auto';
      player.setAttribute('muted','');player.setAttribute('playsinline','');player.setAttribute('aria-hidden','true');
      player.addEventListener('loadedmetadata',()=>{if(video===player){ready=true;updateTarget();}}, {once:true});
      player.addEventListener('seeked',()=>{if(video===player)layer.dataset.videoPainted='true';}, {once:true});
      player.addEventListener('error',()=>{if(video===player)cleanupMedia();}, {once:true});
      player.src=blobUrl;layer.append(player);
    } catch(e) {
      // Preserve the exact first-frame poster if the network/media fails.
      if(!request.signal.aborted) layer.dataset.videoFailed='true';
    }
  }
  function tick() {
    if(stopped || reduce.matches) return;
    if(ready && video && !video.seeking) {
      current += (target-current)*.2;
      const time=clamp(current)*Math.max(0,video.duration-.025);
      if(Math.abs(video.currentTime-time)>.015) video.currentTime=time;
    }
    raf=requestAnimationFrame(tick);
  }
  async function prime() {
    if(!video || !mobileSource() || reduce.matches) return;
    try {await video.play();video.pause();} catch { /* Poster remains usable. */ }
  }
  function mediaChanged() {
    cancelAnimationFrame(raf);cleanupMedia();current=target;
    if(!reduce.matches){void loadMedia();raf=requestAnimationFrame(tick);}
    layout();
  }
  mobile.addEventListener('change',mediaChanged);reduce.addEventListener('change',mediaChanged);
  window.addEventListener('scroll',updateTarget,{passive:true});window.addEventListener('resize',layout);
  window.addEventListener('orientationchange',layout);window.addEventListener('pointerdown',prime,{passive:true});
  layout();if(!reduce.matches){void loadMedia();raf=requestAnimationFrame(tick);}
  window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(raf);cleanupMedia();});
  window.addEventListener('pageshow',event=>{if(event.persisted){stopped=false;mediaChanged();}});
}
setupJourney();

const fields = ['hens','eggs','price','feed','bedding','other'];
const money = value => new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0}).format(value);
function calculate() {
  const input=fields.map(id=>$('#'+id));
  const valid=input.every(el=>el.value!==''&&Number.isFinite(Number(el.value))&&Number(el.value)>=Number(el.min)&&Number(el.value)<=Number(el.max));
  const [hens,eggs,price,feed,bedding,other]=input.map(el=>Number(el.value));
  $('#hens-count').replaceChildren(document.createTextNode(String(hens)));
  const unit=document.createElement('span');unit.textContent=' szt.';$('#hens-count').append(unit);
  $('#calculator-error').hidden=valid;
  const monthly=hens*eggs*30/7;
  const value=monthly*price;
  const costs=feed+bedding+other;
  const balance=value-costs;
  $('#balance').textContent=valid?money(balance):'…';
  $('#monthly-eggs').textContent=valid?money(monthly)+' szt.':'…';
  $('#egg-value').textContent=valid?money(value)+' zł':'…';
  $('#total-costs').textContent=valid?money(costs)+' zł':'…';
  $('#balance-explanation').textContent=!valid?'Uzupełnij założenia':balance>=0?'wartość ponad wpisane koszty':'koszty powyżej wartości jajek';
}
fields.forEach(id=>$('#'+id).addEventListener('input',calculate));calculate();

const contactForm = $('#contact-form');
const preview = $('#message-preview');
contactForm.addEventListener('submit',e=>{
  e.preventDefault();if(!contactForm.reportValidity())return;
  const data=new FormData(contactForm);
  const name=String(data.get('name')).trim();const email=String(data.get('email')).trim();const message=String(data.get('message')).trim();
  if(name.length<2||message.length<10){$('#message').setCustomValidity('Wpisz wiadomość zawierającą co najmniej 10 znaków.');$('#message').reportValidity();return;}
  const text='Cześć!\n\n'+message+'\n\n'+name+'\nAdres do odpowiedzi: '+email;
  $('#prepared-message').value=text;
  $('#email-link').href='mailto:tomasz.jader@gmail.com?subject='+encodeURIComponent('Zapytanie o BalconyFarm')+'&body='+encodeURIComponent(text);
  preview.hidden=false;contactForm.hidden=true;$('#copy-status').textContent='';$('#prepared-message').focus();
});
$('#message').addEventListener('input',()=>$('#message').setCustomValidity(''));
$('#copy-message').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText($('#prepared-message').value);$('#copy-status').textContent='Treść skopiowana.';}
  catch{$('#prepared-message').focus();$('#prepared-message').select();$('#copy-status').textContent='Zaznaczono treść. Skopiuj ją skrótem klawiaturowym.';}
});
$('#edit-message').addEventListener('click',()=>{contactForm.hidden=false;preview.hidden=true;$('#message').focus();});
