const toggler = document.getElementById('navToggler');
const navCollapse = document.getElementById('navCollapse');
toggler.addEventListener('click', () => {
  navCollapse.classList.toggle('open');
});
/* close on link click */
navCollapse.querySelectorAll('.nav-link').forEach(l => {
  l.addEventListener('click', () => navCollapse.classList.remove('open'));
});

/* ── Active nav link on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if(window.scrollY >= s.offsetTop - 130) cur = s.id; });
  navLinks.forEach(l => {
    l.classList.toggle('active-link', l.getAttribute('href') === '#' + cur);
  });
  /* FAB visibility */
  document.getElementById('fabTop').classList.toggle('visible', window.scrollY > 400);
  /* Stats animation trigger */
  const sb = document.getElementById('statsBar');
  if(sb && window.scrollY + window.innerHeight > sb.offsetTop + 80){
    sb.classList.add('counting');
  }
});

/* ── FAQ accordion ── */
function toggleFaq(qEl) {
  const item = qEl.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}


document.querySelectorAll(".stars").forEach(starBox => {
  let rating = starBox.getAttribute("data-rating");

//   // create 5 stars
  for (let i = 1; i <= 5; i++) {
    let star = document.createElement("span");
    star.innerHTML = "★";

    if (i <= rating) {
      star.classList.add("active");
    }

    // click event
    star.addEventListener("click", () => {
      let allStars = starBox.querySelectorAll("span");
      allStars.forEach((s, index) => {
        if (index < i) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });

    starBox.appendChild(star);
  }
});


// 🔹 Gold Rate
async function fetchGoldRate() {

  console.log("Gold rate function started");

  const goldElement = document.getElementsByClassName("goldRate");

  if (goldElement.length === 0) {
    console.log("goldRate element not found");
    return;
  }

  try {

    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem("gold_date");
    const savedRate = localStorage.getItem("gold_rate");

    // ✅ Cache check
    if (savedDate === today && savedRate) {
      for (let i = 0; i < goldElement.length; i++) {
        goldElement[i].innerText = "₹ " + savedRate + " / கிராம்";
      }
      return;
    }

    console.log("Fetching gold rate from API");

    const response = await fetch("https://www.goldapi.io/api/XAU/INR", {
      headers: {
        "x-access-token": "YOUR_API_KEY"
      }
    });

    if (!response.ok) throw new Error("API Error");

    const data = await response.json();

    const pricePerGram = data.price / 31.1035;
    const finalRate = pricePerGram.toFixed(0);

    console.log("Gold Rate per gram:", finalRate);

    // ✅ Save cache
    localStorage.setItem("gold_date", today);
    localStorage.setItem("gold_rate", finalRate);

    // ✅ Update ALL elements
    for (let i = 0; i < goldElement.length; i++) {
      goldElement[i].innerText = "₹ " + finalRate + " / கிராம்";
    }

  } catch (error) {
    console.error("Gold API error:", error);

    const savedRate = localStorage.getItem("gold_rate") || "----";

    for (let i = 0; i < goldElement.length; i++) {
      goldElement[i].innerText = "₹ " + savedRate + " / கிராம்";
    }
  }
}

// 🔥 MUST CALL
// fetchGoldRate();


// 🔹 Supabase Config
const supabaseUrl = "https://cepjynxdrtgwxuvgxshy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcGp5bnhkcnRnd3h1dmd4c2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDU1NjgsImV4cCI6MjA4ODI4MTU2OH0.iheA__HV_-UA9ryHecSyFEfbotIfq8gp95mJECsytIQ"

console.log("Supabase URL:", supabaseUrl);

const { createClient } = supabase;
const client = createClient(supabaseUrl, supabaseKey);

const bucket = "banners";

let fileInput;
let bannerList;


// 🔹 Load Carousel
async function loadCarouselBanners() {

  console.log("Loading carousel banners");

  const container = document.getElementById("bannerCarousel");
  if (!container) {
    console.log("Carousel container not found");
    return;
  }

  const { data, error } = await client.storage
    .from(bucket)
    .list("", { limit: 100 });

  if (error) {
    console.error("Banner list error:", error);
    return;
  }

  console.log("Banner files:", data);

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No banners found</p>";
    return;
  }

  data.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));

  container.innerHTML = "";

  data.forEach((file, index) => {

    const imageUrl =
      `${supabaseUrl}/storage/v1/object/public/${bucket}/${file.name}`;

    console.log("Banner URL:", imageUrl);

    const div = document.createElement("div");
    div.className = "carousel-item " + (index === 0 ? "active" : "");

    div.innerHTML = `<img src="${imageUrl}" class="d-block w-100">`;

    container.appendChild(div);
  });

}


window.onload = () => {
  document.getElementById("hero").scrollIntoView();
}

  // 🔥 ADD THIS HERE
  // Wait for entire page to load
  window.addEventListener('load', function() {
    const el = document.getElementById('cnt10000'); // guaranteed match
    if(el){
      el.textContent = '10,000+'; // straight output
    }
  });


// 🔹 Page Load
window.addEventListener("load", function () {

  console.log("Page Loaded");

  fetchGoldRate();

  if(document.getElementById("bannerCarousel")){
    console.log("Carousel detected");
    loadCarouselBanners();
  }

  if(document.getElementById("bannerList")){
    console.log("Admin banner list detected");
    loadAdminBanners();
  }

  fileInput = document.getElementById("fileInput");
  bannerList = document.getElementById("bannerList");

});


// 🔹 Upload
async function uploadBanners() {

  console.log("Upload button clicked");

  const files = fileInput.files;

  if (!files.length) {
    alert("Select file first");
    return;
  }

  for (let file of files) {

    const fileName = Date.now() + "_" + file.name;

    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, file);

    console.log("Upload response:", data, error);

    if (error) {
      alert("Upload failed: " + error.message);
      return;
    }
  }

  // ✅ loop முடிந்த பிறகு மட்டும்
  alert("Upload Success");

  fileInput.value = "";

  loadAdminBanners();
}
// 🔹 Delete
async function deleteBanner(fileName) {

  console.log("Deleting banner:", fileName);

  const { error } = await client.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    console.error("Delete error:", error);
    alert("Delete failed");
    return;
  }

  console.log("Banner deleted:", fileName);

  alert("Deleted");

  loadAdminBanners();
}


// 🔹 Admin Banner List
async function loadAdminBanners() {

  console.log("Loading admin banner list");

  const { data, error } = await client.storage
    .from(bucket)
    .list("", { limit: 100 });

  if (error) {
    console.error("Admin list error:", error);
    return;
  }

  console.log("Admin banner files:", data);

  bannerList.innerHTML = "";

  data.forEach(file => {

    const imageUrl =
      `${supabaseUrl}/storage/v1/object/public/${bucket}/${file.name}`;

    const div = document.createElement("div");
    div.className = "col-md-3";

    div.innerHTML = `
      <div class="banner-box">
        <img src="${imageUrl}">
        <button class="btn btn-danger w-100 mt-2"
        onclick="deleteBanner('${file.name}')">
        Delete
        </button>
      </div>
    `;

    bannerList.appendChild(div);
  });

}