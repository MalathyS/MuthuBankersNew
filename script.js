/* ═══════════════════════════════════════════════════
   SUPABASE CONFIG
═══════════════════════════════════════════════════ */
const supabaseUrl  = "https://cepjynxdrtgwxuvgxshy.supabase.co";
const supabaseKey  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcGp5bnhkcnRnd3h1dmd4c2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDU1NjgsImV4cCI6MjA4ODI4MTU2OH0.iheA__HV_-UA9ryHecSyFEfbotIfq8gp95mJECsytIQ";
const { createClient } = supabase;
const client = createClient(supabaseUrl, supabaseKey);
const bucket  = "banners";

/* ═══════════════════════════════════════════════════
   NAVBAR TOGGLE
═══════════════════════════════════════════════════ */
const toggler     = document.getElementById('navToggler');
const navCollapse = document.getElementById('navCollapse');
if(toggler && navCollapse){
  toggler.addEventListener('click', () => navCollapse.classList.toggle('open'));
  navCollapse.querySelectorAll('.nav-link').forEach(l =>
    l.addEventListener('click', () => navCollapse.classList.remove('open'))
  );
}

const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.navbar-nav .nav-link');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if(window.scrollY >= s.offsetTop - 130) cur = s.id; });
  navLinks.forEach(l =>
    l.classList.toggle('active-link', l.getAttribute('href') === '#' + cur)
  );
  const fab = document.getElementById('fabTop');
  if(fab) fab.classList.toggle('visible', window.scrollY > 400);
  const sb = document.getElementById('statsBar');
  if(sb && window.scrollY + window.innerHeight > sb.offsetTop + 80)
    sb.classList.add('counting');
});

/* ═══════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════ */
function toggleFaq(qEl) {
  const item   = qEl.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if(!isOpen) item.classList.add('open');
}

/* ═══════════════════════════════════════════════════
   GOLD RATE
═══════════════════════════════════════════════════ */
async function fetchGoldRate() {
  const elems = document.getElementsByClassName("goldRate");
  if(!elems.length) return;
  try {
    const today     = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem("gold_date");
    const savedRate = localStorage.getItem("gold_rate");
    if(savedDate === today && savedRate){
      Array.from(elems).forEach(e => e.innerText = "Rs " + savedRate + " / gram");
      return;
    }
    const res  = await fetch("https://www.goldapi.io/api/XAU/INR",
      { headers:{ "x-access-token":"goldapi-19o1g6smlyro24y-io" }});
    if(!res.ok) throw new Error("API Error");
    const data = await res.json();
    const rate = Math.round(data.price / 31.1035);
    localStorage.setItem("gold_date", today);
    localStorage.setItem("gold_rate", rate);
    Array.from(elems).forEach(e => e.innerText = "Rs " + rate + " / gram");
  } catch {
    const r = localStorage.getItem("gold_rate") || "----";
    Array.from(elems).forEach(e => e.innerText = "Rs " + r + " / gram");
  }
}

/* ═══════════════════════════════════════════════════
   BANNER CAROUSEL
═══════════════════════════════════════════════════ */
async function loadCarouselBanners() {
  const container = document.getElementById("bannerCarousel");
  if(!container) return;
  const { data, error } = await client.storage.from(bucket).list("",{ limit:100 });
  if(error || !data || !data.length){ container.innerHTML=""; return; }
  data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  container.innerHTML = "";
  data.forEach((file, i) => {
    const url = supabaseUrl+"/storage/v1/object/public/"+bucket+"/"+file.name;
    const div = document.createElement("div");
    div.className = "carousel-item" + (i===0?" active":"");
    div.innerHTML = '<img src="'+url+'" class="d-block w-100" style="max-height:280px;object-fit:contain;">';
    container.appendChild(div);
  });
}

/* ═══════════════════════════════════════════════════
   REVIEW CAROUSEL
═══════════════════════════════════════════════════ */
let revData    = [];
let revCurrent = 0;

function starsHTML(rating){
  return Array.from({length:5}, (_,i) =>
    '<span class="'+(i < rating ? 'lit' : '')+'">&#9733;</span>'
  ).join('');
}

async function loadReviewCarousel() {
  const track = document.getElementById('revTrack');
  const dots  = document.getElementById('revDots');
  if(!track) return;

  const { data, error } = await client
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if(error){ console.error('Reviews load error:', error); return; }

  revData    = data || [];
  revCurrent = 0;

  if(!revData.length){
    track.innerHTML = '<div class="rev-loading">இன்னும் கருத்துகள் இல்லை.</div>';
    if(dots) dots.innerHTML = '';
    return;
  }

  track.innerHTML = revData.map(r =>
    '<div class="rev-slide"><div class="rev-card">' +
    '<div class="rev-stars">'+starsHTML(r.rating)+'</div>' +
    '<p class="rev-text">&ldquo;'+r.review_text+'&rdquo;</p>' +
    '<div class="rev-name">&mdash; '+r.name+'</div>' +
    '</div></div>'
  ).join('');

  if(dots){
    dots.innerHTML = revData.map((_,i) =>
      '<button class="rev-dot'+(i===0?' active':'')+'" aria-label="Review '+(i+1)+'"></button>'
    ).join('');
    dots.querySelectorAll('.rev-dot').forEach(function(d,i){
      d.addEventListener('click', function(){ goToReview(i); });
    });
  }

  updateRevArrows();

  setInterval(function(){
    if(revData.length > 1) goToReview((revCurrent + 1) % revData.length);
  }, 5000);
}

function goToReview(index) {
  revCurrent = index;
  const track = document.getElementById('revTrack');
  if(track) track.style.transform = 'translateX(-'+(index * 100)+'%)';
  document.querySelectorAll('.rev-dot').forEach(function(d,i){
    d.classList.toggle('active', i === index);
  });
  updateRevArrows();
}

function updateRevArrows(){
  const prev = document.getElementById('revPrev');
  const next = document.getElementById('revNext');
  if(prev) prev.disabled = revData.length <= 1;
  if(next) next.disabled = revData.length <= 1;
}

var rPrev = document.getElementById('revPrev');
var rNext = document.getElementById('revNext');
if(rPrev) rPrev.addEventListener('click', function(){
  goToReview((revCurrent - 1 + revData.length) % revData.length);
});
if(rNext) rNext.addEventListener('click', function(){
  goToReview((revCurrent + 1) % revData.length);
});

/* Touch swipe */
(function(){
  var outer = document.querySelector('.rev-track-outer');
  if(!outer) return;
  var startX = 0;
  outer.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; },{passive:true});
  outer.addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - startX;
    if(Math.abs(dx) > 40){
      if(dx < 0) goToReview((revCurrent+1) % revData.length);
      else        goToReview((revCurrent-1+revData.length) % revData.length);
    }
  });
})();

/* ═══════════════════════════════════════════════════
   ADD REVIEW MODAL
═══════════════════════════════════════════════════ */
function openReviewModal(){
  document.getElementById('revModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeReviewModal(e){
  if(e && e.target !== document.getElementById('revModalOverlay')) return;
  _closeModal();
}
function _closeModal(){
  var overlay = document.getElementById('revModalOverlay');
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', function(e){
  if(e.key==='Escape') _closeModal();
});

/* Star input */
var starSpans = document.querySelectorAll('#revStarInput span');
starSpans.forEach(function(s){
  s.addEventListener('mouseover', function(){
    var v = +s.dataset.v;
    starSpans.forEach(function(x){ x.classList.toggle('sel', +x.dataset.v <= v); });
  });
  s.addEventListener('click', function(){
    document.getElementById('revStarVal').value = s.dataset.v;
    var val = +s.dataset.v;
    starSpans.forEach(function(x){ x.classList.toggle('sel', +x.dataset.v <= val); });
  });
});
var starInput = document.getElementById('revStarInput');
if(starInput) starInput.addEventListener('mouseleave', function(){
  var val = +(document.getElementById('revStarVal').value);
  starSpans.forEach(function(x){ x.classList.toggle('sel', +x.dataset.v <= val); });
});

async function submitReview(){
  var name   = document.getElementById('revName').value.trim();
  var rating = +(document.getElementById('revStarVal').value);
  var text   = document.getElementById('revText').value.trim();
  var msg    = document.getElementById('revMsg');
  var btn    = document.getElementById('revSubmitBtn');

  msg.style.color = '#8b0000';
  if(!name)  { msg.textContent='பெயரை உள்ளிடவும்.'; return; }
  if(!rating){ msg.textContent='மதிப்பீட்டை தேர்ந்தெடுக்கவும்.'; return; }
  if(!text)  { msg.textContent='கருத்தை உள்ளிடவும்.'; return; }

  btn.disabled    = true;
  msg.textContent = 'சமர்ப்பிக்கப்படுகிறது...';

  var result = await client.from('reviews').insert([{
    name: name,
    rating: rating,
    review_text: text,
    approved: false
  }]);

  if(result.error){
    console.error(result.error);
    msg.textContent = 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.';
    btn.disabled = false;
    return;
  }

  msg.style.color = 'green';
  msg.textContent = 'நன்றி! உங்கள் கருத்து அனுமதிக்கப்பட்ட பின் காட்டப்படும்.';
  document.getElementById('revName').value = '';
  document.getElementById('revText').value = '';
  document.getElementById('revStarVal').value = '0';
  starSpans.forEach(function(x){ x.classList.remove('sel'); });
  setTimeout(_closeModal, 2800);
}

/* ═══════════════════════════════════════════════════
   ADMIN – BANNERS
═══════════════════════════════════════════════════ */
var fileInput, bannerList;

async function uploadBanners(){
  var files = fileInput && fileInput.files;
  if(!files || !files.length){ alert("கோப்பை தேர்ந்தெடுக்கவும்"); return; }
  for(var i=0;i<files.length;i++){
    var file     = files[i];
    var fileName = Date.now() + "_" + file.name;
    var result   = await client.storage.from(bucket).upload(fileName, file);
    if(result.error){ alert("Upload failed: " + result.error.message); return; }
  }
  alert("பேனர் பதிவேற்றப்பட்டது!");
  fileInput.value = "";
  loadAdminBanners();
}

async function deleteBanner(fileName){
  if(!confirm("இந்த பேனரை நீக்கவா?")) return;
  var result = await client.storage.from(bucket).remove([fileName]);
  if(result.error){ alert("Delete failed"); return; }
  loadAdminBanners();
}

async function loadAdminBanners(){
  if(!bannerList) return;
  var result = await client.storage.from(bucket).list("",{ limit:100 });
  if(result.error){ console.error(result.error); return; }
  var data = result.data;
  bannerList.innerHTML = "";
  if(!data || !data.length){
    bannerList.innerHTML='<p class="text-muted text-center col-12">பேனர்கள் இல்லை</p>';
    return;
  }
  data.forEach(function(file){
    var url = supabaseUrl+"/storage/v1/object/public/"+bucket+"/"+file.name;
    var div = document.createElement("div");
    div.className = "col-md-3 col-sm-6 mb-3";
    div.innerHTML =
      '<div class="banner-box">' +
      '<img src="'+url+'" alt="banner">' +
      '<button class="btn delete-btn w-100 mt-2" onclick="deleteBanner(\''+file.name+'\')">🗑️ நீக்கு</button>' +
      '</div>';
    bannerList.appendChild(div);
  });
}

/* ═══════════════════════════════════════════════════
   ADMIN – REVIEWS
═══════════════════════════════════════════════════ */
async function loadAdminReviews(){
  var container = document.getElementById('adminReviewList');
  if(!container) return;
  container.innerHTML='<p class="text-muted text-center col-12">ஏற்றப்படுகிறது...</p>';

  var result = await client
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if(result.error){ console.error(result.error); return; }
  var data = result.data;
  container.innerHTML = '';

  if(!data || !data.length){
    container.innerHTML='<p class="text-muted text-center col-12">கருத்துகள் இல்லை</p>';
    return;
  }

  data.forEach(function(r){
    var stars = '&#9733;'.repeat(r.rating) + '&#9734;'.repeat(5 - r.rating);
    var badge = r.approved
      ? '<span class="badge bg-success">&#10003; அங்கீகரிக்கப்பட்டது</span>'
      : '<span class="badge bg-warning text-dark">&#8987; நிலுவையில்</span>';
    var approveBtn = !r.approved
      ? '<button class="btn btn-success btn-sm flex-fill" onclick="approveReview('+r.id+')">&#10003; அங்கீகரி</button>'
      : '<button class="btn btn-secondary btn-sm flex-fill" onclick="unapproveReview('+r.id+')">&#9940; மறை</button>';
    var div = document.createElement('div');
    div.className = 'col-md-6 col-lg-4 mb-3';
    div.innerHTML =
      '<div class="review-admin-card '+(r.approved?'approved':'pending')+'">' +
      '<div class="d-flex justify-content-between align-items-start mb-2">' +
      '<strong class="rev-admin-name">'+r.name+'</strong>'+badge+
      '</div>' +
      '<div class="rev-admin-stars">'+stars+'</div>' +
      '<p class="rev-admin-text">&ldquo;'+r.review_text+'&rdquo;</p>' +
      '<small class="rev-admin-date">'+new Date(r.created_at).toLocaleDateString('ta-IN')+'</small>' +
      '<div class="rev-admin-actions mt-3 d-flex gap-2">' +
      approveBtn +
      '<button class="btn btn-danger btn-sm flex-fill" onclick="deleteReview('+r.id+')">&#128465; நீக்கு</button>' +
      '</div></div>';
    container.appendChild(div);
  });
}

async function approveReview(id){
  await client.from('reviews').update({ approved:true }).eq('id', id);
  loadAdminReviews();
}
async function unapproveReview(id){
  await client.from('reviews').update({ approved:false }).eq('id', id);
  loadAdminReviews();
}
async function deleteReview(id){
  if(!confirm("இந்த கருத்தை நிரந்தரமாக நீக்கவா?")) return;
  await client.from('reviews').delete().eq('id', id);
  loadAdminReviews();
}

/* ═══════════════════════════════════════════════════
   PAGE LOAD
═══════════════════════════════════════════════════ */
window.addEventListener('load', function(){
  var c10k = document.getElementById('cnt10000');
  if(c10k) c10k.textContent = '10,000+';

  fetchGoldRate();

  if(document.getElementById('bannerCarousel')) loadCarouselBanners();
  if(document.getElementById('revTrack'))       loadReviewCarousel();

  bannerList = document.getElementById('bannerList');
  fileInput  = document.getElementById('fileInput');
  if(bannerList) loadAdminBanners();
  if(document.getElementById('adminReviewList')) loadAdminReviews();
});