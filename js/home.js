// ==========================================
// QuickBite - Home Page Script
// Developer: Mohd Fahad
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initAnimatedHeroText();
  renderCategories();
  renderFeatured();
  initBurgerScrollAnimation();
  initOfferCountdownTimer();
  initMangoParallax();
});

window.addEventListener('menuDataLoaded', () => {
  renderCategories();
  renderFeatured();
});

/**
 * Animated Typewriter Hero Text Effect
 * Types out a fresh thought on page load/refresh & holds it!
 * Changes to a new thought on every refresh!
 */
function initAnimatedHeroText() {
  const typedTextSpan = document.getElementById('typedHeroText');
  if (!typedTextSpan) return;

  const thoughts = [
    "Delicious?",
    "Hot & Fresh Biryani?",
    "Cheesy Loaded Pizza?",
    "Sizzling Juicy Burgers?",
    "Crispy Golden Snacks?",
    "Sweet Desserts?",
    "Authentic Chinese?",
    "Delivered in 30 Mins?",
    "Finger-Licking Good?",
    "Extraordinary Flavours?"
  ];

  // Retrieve last thought index from sessionStorage so EVERY refresh gets a NEW thought!
  let lastIndex = parseInt(sessionStorage.getItem('quickbite_hero_thought_index'));
  if (isNaN(lastIndex)) lastIndex = -1;

  let thoughtIndex;
  do {
    thoughtIndex = Math.floor(Math.random() * thoughts.length);
  } while (thoughtIndex === lastIndex && thoughts.length > 1);

  sessionStorage.setItem('quickbite_hero_thought_index', thoughtIndex);

  const selectedThought = thoughts[thoughtIndex];
  let charIndex = 0;
  const typeSpeed = 70;

  function type() {
    if (charIndex <= selectedThought.length) {
      typedTextSpan.textContent = selectedThought.substring(0, charIndex);
      charIndex++;
      setTimeout(type, typeSpeed);
    }
  }

  typedTextSpan.textContent = '';
  setTimeout(type, 300);
}

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  // Skip 'all' category on home page
  const cats = CATEGORIES.filter(c => c.id !== 'all');

  grid.innerHTML = cats.map(cat => {
    const count = MENU_ITEMS.filter(i => i.category === cat.id).length;
    return `
      <a href="menu.html?cat=${cat.id}" class="cat-card" style="--cat-color:${cat.color}; --cat-bg:${cat.bg};">
        <div class="cat-card-inner">
          <div class="cat-thumb-wrap">
            <img src="${cat.image}" alt="${cat.name}" class="cat-thumb" loading="lazy" />
          </div>
          <div class="cat-info">
            <div class="cat-name">${cat.name}</div>
            <div class="cat-count">${count} item${count !== 1 ? 's' : ''}</div>
          </div>
          <i class="fas fa-arrow-right cat-arrow"></i>
        </div>
      </a>
    `;
  }).join('');
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = getFeaturedItems();
  if (featured.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No featured items</p>';
    return;
  }
  grid.innerHTML = featured.slice(0, 10).map(item => createFoodCard(item)).join('');
}

/**
 * Interactive Scroll-Assembling Burger Animation
 * Powered by GSAP & ScrollTrigger with pure JS fallback
 */
function initBurgerScrollAnimation() {
  const burgerAssembly = document.getElementById('burgerAssembly');
  if (!burgerAssembly) return;

  const topBun = burgerAssembly.querySelector('.bun-top');
  const lettuce = burgerAssembly.querySelector('.lettuce');
  const cheese = burgerAssembly.querySelector('.cheese');
  const patty = burgerAssembly.querySelector('.patty');
  const bottomBun = burgerAssembly.querySelector('.bun-bottom');
  const plateGlow = burgerAssembly.querySelector('.burger-plate-glow');

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Initial spread state:
    gsap.set(topBun, { y: -150, rotation: -6, opacity: 0.9 });
    gsap.set(lettuce, { y: -75, rotation: 5, opacity: 0.95 });
    gsap.set(cheese, { y: 0, rotation: -3, opacity: 0.95 });
    gsap.set(patty, { y: 75, rotation: 4, opacity: 0.95 });
    gsap.set(bottomBun, { y: 150, rotation: -4, opacity: 0.9 });
    gsap.set(plateGlow, { scale: 0.7, opacity: 0.4 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#home',
        start: 'top top',
        end: 'bottom 40%',
        scrub: 1
      }
    });

    tl.to(topBun, { y: 0, rotation: 0, opacity: 1, ease: 'none' }, 0)
      .to(lettuce, { y: 0, rotation: 0, opacity: 1, ease: 'none' }, 0)
      .to(cheese, { y: 0, rotation: 0, opacity: 1, ease: 'none' }, 0)
      .to(patty, { y: 0, rotation: 0, opacity: 1, ease: 'none' }, 0)
      .to(bottomBun, { y: 0, rotation: 0, opacity: 1, ease: 'none' }, 0)
      .to(plateGlow, { scale: 1.15, opacity: 1, ease: 'none' }, 0);

  } else {
    // Pure JS scroll fallback
    const handleScroll = () => {
      const hero = document.getElementById('home');
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const scrollRatio = Math.min(Math.max(-rect.top / (rect.height * 0.6), 0), 1);

      topBun.style.transform = `translateY(${-150 * (1 - scrollRatio)}px) rotate(${(-6 * (1 - scrollRatio))}deg)`;
      lettuce.style.transform = `translateY(${-75 * (1 - scrollRatio)}px) rotate(${(5 * (1 - scrollRatio))}deg)`;
      cheese.style.transform = `translateY(0px) rotate(${(-3 * (1 - scrollRatio))}deg)`;
      patty.style.transform = `translateY(${(75 * (1 - scrollRatio))}px) rotate(${(4 * (1 - scrollRatio))}deg)`;
      bottomBun.style.transform = `translateY(${(150 * (1 - scrollRatio))}px) rotate(${(-4 * (1 - scrollRatio))}deg)`;
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }
}

/**
 * Dynamic Real-Time Offer Countdown Timer
 */
function initOfferCountdownTimer() {
  const timerElem = document.getElementById('offerTimer');
  if (!timerElem) return;

  let targetTime = sessionStorage.getItem('quickbite_offer_target_time');
  if (!targetTime) {
    targetTime = Date.now() + (5 * 3600 + 42 * 60 + 18) * 1000;
    sessionStorage.setItem('quickbite_offer_target_time', targetTime);
  } else {
    targetTime = parseInt(targetTime);
  }

  function updateTimer() {
    const now = Date.now();
    let diff = Math.max(0, Math.floor((targetTime - now) / 1000));

    if (diff === 0) {
      targetTime = Date.now() + 6 * 3600 * 1000;
      sessionStorage.setItem('quickbite_offer_target_time', targetTime);
      diff = 6 * 3600;
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    const pad = num => String(num).padStart(2, '0');
    timerElem.textContent = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/**
 * Interactive Promo Offer Switcher
 * Dynamically updates banner titles, highlights code, copies code, and triggers glass pop animation
 */
function selectPromoOffer(code, discountText, titleText, element) {
  // Update active state on buttons
  const buttons = document.querySelectorAll('.offer-code-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }

  // Update banner text content dynamically
  const titleElem = document.getElementById('offerTitle');
  const discountElem = document.getElementById('offerDiscountText');
  const codeTagElem = document.getElementById('offerCodeTag');

  if (discountElem) discountElem.textContent = discountText;
  if (titleElem) {
    titleElem.innerHTML = `Get <span class="highlight-orange" id="offerDiscountText">${discountText}</span> on Your Order!`;
  }
  if (codeTagElem) codeTagElem.textContent = code;

  // Copy code to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).catch(() => {});
  }

  // Show interactive Toast notification
  if (typeof showToast === 'function') {
    showToast(`Promo Code "${code}" copied! Applied automatically at checkout.`, 'success');
  }

  // Trigger pop pulse animation on Mango Shake Glass
  const glassWrap = document.getElementById('shakeGlassWrap');
  if (glassWrap) {
    glassWrap.classList.remove('glass-pulse-active');
    void glassWrap.offsetWidth; // Trigger reflow
    glassWrap.classList.add('glass-pulse-active');
  }
}

/**
 * Interactive 3D Parallax Tilt Effect on Mango Shake Glass Showcase
 */
function initMangoParallax() {
  const card = document.getElementById('mangoShowcaseCard');
  const glassWrap = document.getElementById('shakeGlassWrap');
  if (!card || !glassWrap) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const tiltX = (y / (rect.height / 2)) * -12;
    const tiltY = (x / (rect.width / 2)) * 14;

    glassWrap.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.08)`;
  });

  card.addEventListener('mouseleave', () => {
    glassWrap.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
  });
}
