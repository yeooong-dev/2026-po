// HEADER
// 스크롤 헤더
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 0);
});

// 공통
// fade-up 애니메이션
const items = document.querySelectorAll(".fade-up");
const items2 = document.querySelectorAll(".fade-up-02");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.2 },
);

const observer2 = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  },
  { threshold: 0.8 },
);

items.forEach((item) => observer.observe(item));
items2.forEach((item) => observer2.observe(item));

// ABOUT
// 배경색 애니메이션
(() => {
  const section1 = document.getElementById("section1");
  const fill = document.querySelector("#section1 .s1-bg__fill");
  if (!section1 || !fill) return;

  let ticking = false;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  function update() {
    const y = window.scrollY;
    const vh = window.innerHeight;

    // section1 스크롤하는 동안 0->1
    const p = clamp01(y / vh);

    // 100% (숨김) -> 0% (완전 채움)
    fill.style.transform = `translateY(${(1 - p) * 100}%) translateZ(0)`;

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// PROJECT
// 커서 이미지
const rows = document.querySelectorAll(".project-row");
const preview = document.querySelector(".pj-preview");
const backImg = preview.querySelector(".pj-img--back");
const frontImg = preview.querySelector(".pj-img--front");

let currentSrc = "";
let mouseX = 0,
  mouseY = 0;
let rafId = null;

const offsetX = 40;
const offsetY = 20;

let activeRow = null;        
let isOverLinks = false;    

function render() {
  const x = mouseX + offsetX;
  const y = mouseY + offsetY;
  const scale = preview.classList.contains("show") ? 1 : 0.98;
  preview.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  rafId = null;
}

function movePreview(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!rafId) rafId = requestAnimationFrame(render);
}

// 커서 좌표 항상 최신 유지 (좌상단 튀는거 방지)
document.addEventListener("mousemove", movePreview);

function setPreviewImage(nextSrc) {
  if (!nextSrc || nextSrc === currentSrc) return;

  const img = new Image();
  img.onload = () => {
    frontImg.src = nextSrc;
    preview.classList.add("swap");

    frontImg.addEventListener("transitionend", function handler() {
      backImg.src = nextSrc;
      preview.classList.remove("swap");
      currentSrc = nextSrc;
      frontImg.removeEventListener("transitionend", handler);
    });
  };
  img.src = nextSrc;
}

rows.forEach((row) => {
  row.addEventListener("mouseenter", (e) => {
    activeRow = row;

    if (!isOverLinks) preview.classList.add("show");

    setPreviewImage(row.dataset.img);
  });

  row.addEventListener("mousemove", movePreview);

  row.addEventListener("mouseleave", () => {
    activeRow = null;
    isOverLinks = false;
    preview.classList.remove("show");
  });
});

document.querySelectorAll(".pj-year, .pj-links, .pj-links *").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    isOverLinks = true;
    preview.classList.remove("show");
  });

  el.addEventListener("mouseleave", () => {
    isOverLinks = false;
    if (activeRow) preview.classList.add("show");
  });
});


// CONTACT
const section5 = document.querySelector("#section5");
if (section5) {
  const svg = section5.querySelector(".flight-svg");

  // svg 애니메이션 총 시간(초) = dots(0.8+0.15) / line(1.2+0.2) / plane(0.8+1.0) 중 가장 늦게 끝나는 시간
  // => line: 1.4s, plane: 1.8s 정도라 여유로 1.9s
  const SVG_TOTAL_MS = 1900;

  let doneTimer = null;

  const resetSection5 = () => {
    section5.classList.remove("is-inview", "svg-done");

    // SVG 애니메이션 강제 리셋 트릭
    if (svg) {
      svg.style.display = "none";
      // reflow
      void svg.offsetHeight;
      svg.style.display = "";
    }

    if (doneTimer) {
      clearTimeout(doneTimer);
      doneTimer = null;
    }
  };

  const playSection5 = () => {
    resetSection5();

    // 다음 프레임에 시작 클래스 부여(리셋 후 애니메이션 확실히 재생)
    requestAnimationFrame(() => {
      section5.classList.add("is-inview");

      doneTimer = setTimeout(() => {
        section5.classList.add("svg-done"); // svg 숨김 + 텍스트 표시
      }, SVG_TOTAL_MS);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playSection5();
        } else {
          // 섹션 벗어나면 다시 숨기고 리셋 -> 다음 진입 때 또 재생
          resetSection5();
        }
      });
    },
    { threshold: 0.35 },
  );

  io.observe(section5);
}
