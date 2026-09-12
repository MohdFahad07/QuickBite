// ==========================================
// QuickBite - Menu Page Logic
// ==========================================

let currentCategory = 'all';
let currentFilter = 'all';
let currentSort = 'default';
let currentSearch = '';
let currentMenuPage = 1;
let menuItemsPerPage = 8;

document.addEventListener('DOMContentLoaded', () => {
  buildCategoryTabs();
  checkURLParam(); // must be after buildCategoryTabs so tabs exist
  renderMenu();
});

window.addEventListener('menuDataLoaded', () => {
  buildCategoryTabs();
  checkURLParam();
  renderMenu();
});

function buildCategoryTabs() {
  const tabs = document.getElementById('categoryTabs');
  if (!tabs) return;
  tabs.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (cat.id === currentCategory ? ' active' : '');
    btn.dataset.cat = cat.id;

    const count = cat.id === 'all'
      ? MENU_ITEMS.length
      : MENU_ITEMS.filter(i => i.category === cat.id).length;

    const iconSvg = getCategoryIcon(cat.id, 'cat-tab-svg');

    btn.innerHTML = `
      ${iconSvg}
      <span class="cat-tab-title">${cat.name}</span>
      <span class="cat-tab-count">${count}</span>
    `;
    btn.onclick = () => selectCategory(cat.id, btn);
    tabs.appendChild(btn);
  });
}

function checkURLParam() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat) {
    const tab = document.querySelector(`[data-cat="${cat}"]`);
    if (tab) selectCategory(cat, tab);
  }
}

function selectCategory(cat, btn) {
  currentCategory = cat;
  currentMenuPage = 1;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    const targetBtn = document.querySelector(`[data-cat="${cat}"]`);
    if (targetBtn) targetBtn.classList.add('active');
  }
  renderMenu();
}

function applyFilter(filter, btn) {
  currentFilter = filter;
  currentMenuPage = 1;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMenu();
}

function handleSort(val) {
  currentSort = val;
  currentMenuPage = 1;
  renderMenu();
}

function handleSearch(val) {
  currentSearch = val;
  currentMenuPage = 1;
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
  renderMenu();
}

function clearSearch() {
  const input = document.getElementById('menuSearch');
  if (input) input.value = '';
  currentSearch = '';
  currentMenuPage = 1;
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) clearBtn.style.display = 'none';
  renderMenu();
}

function resetAllFilters() {
  currentCategory = 'all';
  currentFilter = 'all';
  currentSort = 'default';
  currentMenuPage = 1;
  clearSearch();

  const sortSel = document.getElementById('sortSelect');
  if (sortSel) sortSel.value = 'default';

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const filterAll = document.getElementById('filterAll');
  if (filterAll) filterAll.classList.add('active');

  const allCatBtn = document.querySelector('[data-cat="all"]');
  selectCategory('all', allCatBtn);
}

function changeMenuPage(newPage) {
  currentMenuPage = newPage;
  renderMenu();
  const grid = document.getElementById('menuGrid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeMenuPageSize(newSize) {
  menuItemsPerPage = parseInt(newSize) || 8;
  currentMenuPage = 1;
  renderMenu();
}

function renderMenu() {
  let items = getItemsByCategory(currentCategory);

  // Search
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    items = items.filter(i =>
      (i.name && i.name.toLowerCase().includes(q)) ||
      (i.desc && i.desc.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }

  // Filter
  if (currentFilter === 'veg') items = items.filter(i => (i.veg !== undefined ? i.veg : i.isVeg));
  if (currentFilter === 'nonveg') items = items.filter(i => !(i.veg !== undefined ? i.veg : i.isVeg));
  if (currentFilter === 'spicy') items = items.filter(i => (i.spicy !== undefined ? i.spicy : i.isSpicy));

  // Sort
  if (currentSort === 'price-low') items = [...items].sort((a, b) => a.price - b.price);
  if (currentSort === 'price-high') items = [...items].sort((a, b) => b.price - a.price);
  if (currentSort === 'rating') items = [...items].sort((a, b) => b.rating - a.rating);

  const grid = document.getElementById('menuGrid');
  const info = document.getElementById('resultsInfo');
  const tagsContainer = document.getElementById('activeFilterTags');
  const pagBar = document.getElementById('menuPagination');

  if (info) {
    const catObj = CATEGORIES.find(c => c.id === currentCategory);
    const catName = catObj ? catObj.name : 'All';
    info.innerHTML = `Showing <strong>${items.length}</strong> dish${items.length !== 1 ? 'es' : ''} in <span class="highlight-cat">${catName}</span>`;
  }

  // Active filter tags row
  if (tagsContainer) {
    let tagsHtml = '';
    if (currentCategory !== 'all') {
      const catName = CATEGORIES.find(c => c.id === currentCategory)?.name || currentCategory;
      tagsHtml += `<span class="active-tag">Category: ${catName} <i class="fas fa-times" onclick="selectCategory('all', document.querySelector('[data-cat=all]'))"></i></span>`;
    }
    if (currentFilter !== 'all') {
      const filterLabel = currentFilter === 'veg' ? 'Veg Only' : currentFilter === 'nonveg' ? 'Non-Veg' : 'Spicy';
      tagsHtml += `<span class="active-tag">Filter: ${filterLabel} <i class="fas fa-times" onclick="applyFilter('all', document.getElementById('filterAll'))"></i></span>`;
    }
    if (currentSearch) {
      tagsHtml += `<span class="active-tag">Search: "${currentSearch}" <i class="fas fa-times" onclick="clearSearch()"></i></span>`;
    }
    if (tagsHtml) {
      tagsHtml += `<button class="clear-all-tags-btn" onclick="resetAllFilters()"><i class="fas fa-undo"></i> Reset All</button>`;
    }
    tagsContainer.innerHTML = tagsHtml;
  }

  if (!grid) return;

  if (items.length === 0) {
    grid.classList.add('grid-hidden');
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-ring"><i class="fas fa-utensils"></i></div>
        <h3>No dishes match your selection</h3>
        <p>Try searching for a different item or clearing active filters.</p>
        <button class="btn-primary" onclick="resetAllFilters()">
          <i class="fas fa-rotate"></i> Reset All Filters
        </button>
      </div>
    `;
    if (pagBar) pagBar.style.display = 'none';
    return;
  }

  grid.classList.remove('grid-hidden');

  // Pagination calculation
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / menuItemsPerPage) || 1;
  if (currentMenuPage > totalPages) currentMenuPage = totalPages;

  const startIdx = (currentMenuPage - 1) * menuItemsPerPage;
  const endIdx = Math.min(startIdx + menuItemsPerPage, totalItems);
  const pageItems = items.slice(startIdx, endIdx);

  grid.innerHTML = pageItems.map(item => createFoodCard(item)).join('');

  // Render Pagination Bar
  if (pagBar) {
    if (totalItems <= menuItemsPerPage && menuItemsPerPage < 999 && totalPages <= 1) {
      pagBar.style.display = 'none';
    } else {
      pagBar.style.display = 'flex';
      let pageBtns = '';
      for (let p = 1; p <= totalPages; p++) {
        pageBtns += `<button class="page-btn ${p === currentMenuPage ? 'active' : ''}" onclick="changeMenuPage(${p})">${p}</button>`;
      }

      pagBar.innerHTML = `
        <div class="pagination-info">
          Showing <strong>${totalItems > 0 ? startIdx + 1 : 0}–${endIdx}</strong> of <strong>${totalItems}</strong> dishes
        </div>
        <div class="pagination-controls">
          <button class="page-btn" ${currentMenuPage === 1 ? 'disabled' : ''} onclick="changeMenuPage(${currentMenuPage - 1})">
            <i class="fas fa-chevron-left"></i> Prev
          </button>
          ${pageBtns}
          <button class="page-btn" ${currentMenuPage === totalPages ? 'disabled' : ''} onclick="changeMenuPage(${currentMenuPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="page-size-wrapper">
          <span>Items per page:</span>
          <select class="page-size-select" onchange="changeMenuPageSize(this.value)">
            <option value="8" ${menuItemsPerPage === 8 ? 'selected' : ''}>8</option>
            <option value="12" ${menuItemsPerPage === 12 ? 'selected' : ''}>12</option>
            <option value="16" ${menuItemsPerPage === 16 ? 'selected' : ''}>16</option>
            <option value="999" ${menuItemsPerPage === 999 ? 'selected' : ''}>All</option>
          </select>
        </div>
      `;
    }
  }
}
