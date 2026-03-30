const header = document.querySelector(".header");
const wrap = document.querySelector("#wrap");

function getScrollTopValue() {
  return wrap ? wrap.scrollTop : 0;
}

if (wrap) {
  wrap.addEventListener("scroll", updateHeaderColor);
}

window.addEventListener("scroll", updateHeaderColor);
window.addEventListener("resize", updateHeaderColor);

// 스크롤 이벤트
const sections = [
  document.querySelector("#section1"),
  document.querySelector("#section2"),
  document.querySelector("#section3"),
  document.querySelector("#section4"),
  document.querySelector("#section5"),
];

const section3 = document.querySelector("#section3");

let currentIndex = 0;
let isAnimating = false;
let workStage = 0;
let isWheelGestureLocked = false;
let wheelUnlockTimer = null;
let touchStartY = 0;
let touchEndY = 0;
let isTouchGestureLocked = false;

function setWorkStage(stage) {
  if (!section3) return;

  workStage = Math.max(0, Math.min(1, stage));
  section3.classList.remove("work-stage-0", "work-stage-1");
  section3.classList.add(`work-stage-${workStage}`);
}

setWorkStage(0);

function lockWheelGesture() {
  isWheelGestureLocked = true;

  if (wheelUnlockTimer) {
    clearTimeout(wheelUnlockTimer);
  }
}

function releaseWheelGestureWhenStopped(deltaY) {
  if (!isWheelGestureLocked) return;

  if (Math.abs(deltaY) < 4) {
    if (wheelUnlockTimer) {
      clearTimeout(wheelUnlockTimer);
    }

    wheelUnlockTimer = setTimeout(() => {
      isWheelGestureLocked = false;
    }, 80);
  }
}

function getClosestSectionIndex() {
  const currentTop = wrap ? wrap.scrollTop : 0;
  let closestIndex = 0;
  let closestDistance = Infinity;

  sections.forEach((section, index) => {
    if (!section) return;

    const distance = Math.abs(section.offsetTop - currentTop);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function animateScrollTo(targetY, duration = 1000, onComplete) {
  if (!wrap) return;

  const startY = wrap.scrollTop;
  const diff = targetY - startY;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutQuart(progress);

    wrap.scrollTop = startY + diff * eased;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      isAnimating = false;
      currentIndex = getClosestSectionIndex();
      updateHeaderColor();

      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  }

  requestAnimationFrame(step);
}

function goToSection(index, options = {}) {
  if (index < 0 || index >= sections.length || isAnimating) return;

  if (index === 2 && typeof options.workStage === "number") {
    setWorkStage(options.workStage);
  }

  isAnimating = true;
  currentIndex = index;
  animateScrollTo(sections[index].offsetTop, 1000, options.onComplete);
}

function animateWorkStage(nextStage, onComplete) {
  if (isAnimating || nextStage === workStage) return;

  isAnimating = true;
  lockWheelGesture();
  setWorkStage(nextStage);

  setTimeout(() => {
    isAnimating = false;
    currentIndex = 2;

    if (typeof onComplete === "function") {
      onComplete();
    }
  }, 700);
}

function handleSectionSwipe(deltaY) {
  if (isModalOpen) return;
  if (isAnimating) return;
  if (isTouchGestureLocked) return;

  if (Math.abs(deltaY) < 50) return;

  currentIndex = getClosestSectionIndex();
  isTouchGestureLocked = true;

  if (currentIndex === 2) {
    if (deltaY > 0) {
      if (workStage === 0) {
        animateWorkStage(1, () => {
          isTouchGestureLocked = false;
        });
      } else {
        goToSection(3, {
          onComplete: () => {
            isTouchGestureLocked = false;
          },
        });
      }
    } else {
      if (workStage === 1) {
        animateWorkStage(0, () => {
          isTouchGestureLocked = false;
        });
      } else {
        goToSection(1, {
          onComplete: () => {
            isTouchGestureLocked = false;
          },
        });
      }
    }
    return;
  }

  if (deltaY > 0) {
    if (currentIndex === 1) {
      goToSection(2, {
        workStage: 0,
        onComplete: () => {
          isTouchGestureLocked = false;
        },
      });
    } else {
      goToSection(currentIndex + 1, {
        onComplete: () => {
          isTouchGestureLocked = false;
        },
      });
    }
  } else {
    if (currentIndex === 3) {
      goToSection(2, {
        workStage: 1,
        onComplete: () => {
          isTouchGestureLocked = false;
        },
      });
    } else {
      goToSection(currentIndex - 1, {
        onComplete: () => {
          isTouchGestureLocked = false;
        },
      });
    }
  }
}

if (wrap) {
  wrap.addEventListener(
    "wheel",
    (e) => {
      if (isModalOpen) return;

      e.preventDefault();

      releaseWheelGestureWhenStopped(e.deltaY);

      if (isWheelGestureLocked) return;
      if (isAnimating) return;

      if (Math.abs(e.deltaY) < 12) return;

      currentIndex = getClosestSectionIndex();

      if (currentIndex === 2) {
        if (e.deltaY > 0) {
          if (workStage === 0) {
            animateWorkStage(1);
          } else {
            lockWheelGesture();
            goToSection(3, {
              onComplete: () => {
                isWheelGestureLocked = false;
              },
            });
          }
        } else if (e.deltaY < 0) {
          if (workStage === 1) {
            animateWorkStage(0);
          } else {
            lockWheelGesture();
            goToSection(1, {
              onComplete: () => {
                isWheelGestureLocked = false;
              },
            });
          }
        }
        return;
      }

      if (e.deltaY > 0) {
        if (currentIndex === 1) {
          goToSection(2, { workStage: 0 });
        } else {
          goToSection(currentIndex + 1);
        }
      } else if (e.deltaY < 0) {
        if (currentIndex === 3) {
          goToSection(2, { workStage: 1 });
        } else {
          goToSection(currentIndex - 1);
        }
      }
    },
    { passive: false },
  );
}

if (wrap) {
  wrap.addEventListener(
    "touchstart",
    (e) => {
      if (window.innerWidth > 992) return;
      if (isModalOpen) return;
      if (e.touches.length !== 1) return;

      touchStartY = e.touches[0].clientY;
    },
    { passive: true },
  );

  wrap.addEventListener(
    "touchmove",
    (e) => {
      if (window.innerWidth > 992) return;
      if (isModalOpen) return;
      if (isAnimating) {
        e.preventDefault();
        return;
      }

      if (e.touches.length !== 1) return;
      e.preventDefault();
    },
    { passive: false },
  );

  wrap.addEventListener(
    "touchend",
    (e) => {
      if (window.innerWidth > 992) return;
      if (isModalOpen) return;

      touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;

      handleSectionSwipe(deltaY);
    },
    { passive: true },
  );
}

// fade-up 애니메이션
function createFadeObserver(selector, threshold) {
  const elements = document.querySelectorAll(selector);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("show", entry.isIntersecting);
      });
    },
    {
      root: window.innerWidth <= 992 ? null : wrap,
      threshold,
    },
  );

  elements.forEach((element) => observer.observe(element));
}

createFadeObserver(".fade-up", 0.2);
createFadeObserver(".fade-up-02", 0.6);

// 배경색 애니메이션
(() => {
  const section4 = document.getElementById("section4");
  const fill = document.querySelector("#section4 .s1-bg__fill");
  if (!section4 || !fill || !wrap) return;

  let ticking = false;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  function update() {
    const y = wrap.scrollTop;
    const sectionTop = section4.offsetTop;
    const sectionHeight = wrap.clientHeight;

    const speed = 1;
    const progress = clamp01(((y - sectionTop) / sectionHeight) * speed);

    fill.style.transform = `translateY(${(1 - progress) * 100}%) translateZ(0)`;

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  wrap.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// WORK MODAL
const detailBtns = document.querySelectorAll(".detail-btn");
const workModal = document.querySelector("#workModal");
const modalCloseBtn = document.querySelector(".custom-modal__close");
const modalDim = document.querySelector(".custom-modal__dim");
const workModalBody = document.querySelector("#workModalBody");

let isModalOpen = false;

function openModal(button) {
  if (!workModal || !button || !workModalBody) return;

  const templateId = button.dataset.modalTarget;
  const template = document.querySelector(`#${templateId}`);

  if (!template) return;

  workModalBody.innerHTML = template.innerHTML;

  isModalOpen = true;
  workModal.classList.add("show");
  workModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
  if (wrap) wrap.classList.add("modal-open");
}

function closeModal() {
  if (!workModal) return;

  isModalOpen = false;
  workModal.classList.remove("show");
  workModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
  if (wrap) wrap.classList.remove("modal-open");

  setTimeout(() => {
    if (workModalBody) workModalBody.innerHTML = "";
  }, 250);
}

detailBtns.forEach((button) => {
  button.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openModal(button);
  });
});

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeModal);
}

if (modalDim) {
  modalDim.addEventListener("click", closeModal);
}

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && isModalOpen) {
    closeModal();
  }
});

// PROJECT 커서 이미지
const rows = document.querySelectorAll(".project-row");
const preview = document.querySelector(".pj-preview");
const backImg = preview ? preview.querySelector(".pj-img--back") : null;
const frontImg = preview ? preview.querySelector(".pj-img--front") : null;

let currentSrc = "";
let mouseX = 0,
  mouseY = 0;
let rafId = null;

const offsetX = 40;
const offsetY = 20;

let activeRow = null;
let isOverLinks = false;

function render() {
  if (!preview) return;

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

if (preview && backImg && frontImg) {
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
    row.addEventListener("mouseenter", () => {
      activeRow = row;

      if (!isOverLinks) preview.classList.add("show");

      setPreviewImage(row.dataset.img);
    });

    row.addEventListener("mouseleave", () => {
      activeRow = null;
      isOverLinks = false;
      preview.classList.remove("show");
    });
  });

  document
    .querySelectorAll(".pj-year, .pj-links, .pj-links *")
    .forEach((el) => {
      el.addEventListener("mouseenter", () => {
        isOverLinks = true;
        preview.classList.remove("show");
      });

      el.addEventListener("mouseleave", () => {
        isOverLinks = false;
        if (activeRow) preview.classList.add("show");
      });
    });
}

// CONTACT
const section5 = document.querySelector("#section5");
if (section5) {
  const svg = section5.querySelector(".flight-svg");
  const SVG_TOTAL_MS = 1900;
  let doneTimer = null;

  const resetSection5 = () => {
    section5.classList.remove("is-inview", "svg-done");

    if (svg) {
      svg.style.display = "none";
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

    requestAnimationFrame(() => {
      section5.classList.add("is-inview");

      doneTimer = setTimeout(() => {
        section5.classList.add("svg-done");
      }, SVG_TOTAL_MS);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playSection5();
        } else {
          resetSection5();
        }
      });
    },
    {
      root: window.innerWidth <= 992 ? null : wrap,
      threshold: 0.35,
    },
  );

  io.observe(section5);
}

const menuLinks = document.querySelectorAll(".menu a, .side-menu__nav a");
const sideMenu = document.querySelector(".side-menu");
const sideMenuDots = document.querySelectorAll(".side-menu__dot");
const scrollIcon = document.querySelector(".scroll_icon");

function updateHeaderColor() {
  if (!header || !section5) return;

  const scrollTop = getScrollTopValue();
  const triggerPoint = section5.offsetTop - 120;
  const endPoint = section5.offsetTop + section5.offsetHeight - 120;

  const isSection5 = scrollTop >= triggerPoint && scrollTop < endPoint;

  header.classList.toggle("white", isSection5);

  if (scrollIcon) {
    scrollIcon.style.display = isSection5 ? "none" : "flex";
  }

  updateActiveMenu();
}

function updateActiveMenu() {
  if (!sections.length) return;

  const scrollTop = wrap ? wrap.scrollTop : window.scrollY;
  const viewportHeight =
    window.innerWidth <= 992 ? window.innerHeight : wrap.clientHeight;

  const checkPoint = scrollTop + viewportHeight * 0.35;

  let activeSectionId = "";

  sections.forEach((section) => {
    if (!section) return;

    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (checkPoint >= top && checkPoint < bottom) {
      activeSectionId = `#${section.id}`;
    }
  });

  if (!activeSectionId && sections[0]) {
    activeSectionId = `#${sections[0].id}`;
  }

  menuLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === activeSectionId);
  });

  sideMenuDots.forEach((dot) => {
    const target = dot.dataset.target;
    dot.classList.toggle("active", target === activeSectionId);
  });

  if (sideMenu) {
    sideMenu.classList.toggle("is-white", activeSectionId === "#section5");
  }
}

function moveToMenuTarget(targetSelector, targetIndex) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  if (window.innerWidth <= 992) {
    if (wrap) {
      wrap.scrollTo({
        top: target.offsetTop,
        behavior: "smooth",
      });
    }
    return;
  }

  if (isAnimating) return;

  if (targetIndex === 2) {
    setWorkStage(0);
  }

  isAnimating = true;
  currentIndex = targetIndex;
  animateScrollTo(target.offsetTop, 1000, () => {
    if (targetIndex === 2) {
      setWorkStage(0);
    }
    updateHeaderColor();
  });
}

sideMenuDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    moveToMenuTarget(dot.dataset.target, index);
  });
});

document.querySelectorAll(".side-menu__nav a").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const targetSelector = this.getAttribute("href");
    const targetIndex = sections.findIndex(
      (section) => section && `#${section.id}` === targetSelector,
    );

    moveToMenuTarget(targetSelector, targetIndex);
  });
});

updateHeaderColor();
