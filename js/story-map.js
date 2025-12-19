// ===========================================
// STORY MAP INTERAKTIF - by AesPace & GPT-5
// ===========================================

// Inisialisasi Peta
const map = L.map("map", {
  center: [-5.1, 119.45],
  zoom: 11,
  zoomControl: true,
  scrollWheelZoom: true,
  dragging: true,
  doubleClickZoom: true,
  inertia: true,
  worldCopyJump: true
});

// Basemap: ESRI Satellite (World Imagery) — align with WebGIS
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 18,
  attribution: '© Esri'
}).addTo(map);

// =========================
// DATA LOKASI (8 AREA)
// =========================
const locations = [
  {
    id: "lantebung",
    name: "Lantebung, Makassar",
    coords: [-5.07857500, 119.46694167],
    zoom: 16,
    images: ["images/lantebung/1.jpg","images/lantebung/2.jpg", "images/lantebung/3.png"]
  },
  {
    id: "lakkang",
    name: "Pulau Lakkang, Makassar",
    coords: [-5.12244444, 119.48705556],
    zoom: 16,
    images: ["images/lakkang/1.jpg", "images/lakkang/2.jpg", "images/lakkang/3.png"]
  },
  {
    id: "marana",
    name: "Marana, Maros",
    coords: [-4.96448994, 119.53800201],
    zoom: 16,
    images: ["images/marana/1.png", "images/marana/2.png","images/marana/4.jpg"]
  },
  {
    id: "rammang",
    name: "Rammang-Rammang, Maros",
    coords: [-4.93008995, 119.60500336],
    zoom: 16,
    images: ["images/rammang/1.jpg","images/rammang/2.jpg","images/rammang/3.png"]
  },
  {
    id: "binangasangkara",
    name: "Muara Binangasangkara, Maros",
    coords: [-4.88360977, 119.51899719],
    zoom: 16,
    images: ["images/binasangkara/1.png", "images/binasangkara/2.png", "images/binasangkara/3.jpg"]
  },
  {
    id: "puntondo",
    name: "Pantai Puntondo, Takalar",
    coords: [-5.60775995, 119.47200012],
    zoom: 16,
    images: ["images/puntondo/1.png", "images/puntondo/2.png", "images/puntondo/3.png"]
  },
  {
    id: "laikang",
    name: "Teluk Laikang, Takalar",
    coords: [-5.56995010, 119.46900177],
    zoom: 16,
    images: ["images/laikang/1.png", "images/laikang/2.png", "images/laikang/3.jpg"]
  },
  {
    id: "tanakeke",
    name: "Pulau Tanakeke, Takalar",
    coords: [-5.53052998, 119.28600311],
    zoom: 16,
    images: ["images/tanakeke/1.jpg", "images/tanakeke/2.jpg", "images/tanakeke/3.jpg"]
  }
];



// =========================
// MARKER UNTUK TIAP LOKASI
// =========================
const imageMarkers = {}; // Store image markers for each location

// Function to create popup content with images
function createPopupContent(loc) {
  let content = `<div class="popup-content"><h3>${loc.name}</h3><div class="popup-gallery">`;

  loc.images.forEach((imgSrc, index) => {
    const altText = `${loc.name} - Image ${index + 1}`;
    content += `<img src="${imgSrc}" alt="${altText}" class="popup-image" onclick="openImageModal('${imgSrc}', '${altText}')">`;
  });

  content += `</div></div>`;
  return content;
}

locations.forEach((loc) => {
  // Buffer zona (lebih besar agar site terlihat jelas)
  const offset = 0.0015; // Approx ~167m in degrees
  const polygonCoords = [
    [loc.coords[0] - offset, loc.coords[1] - offset],
    [loc.coords[0] - offset, loc.coords[1] + offset],
    [loc.coords[0] + offset, loc.coords[1] + offset],
    [loc.coords[0] + offset, loc.coords[1] - offset]
  ];
  L.polygon(polygonCoords, {
    color: "#52b788",
    fillColor: "#52b788",
    fillOpacity: 0.2,
    weight: 1
  }).addTo(map);

  // Zonation buffer circles (from WebGIS) - diperbesar untuk tampilan site
  const zonationRadii = [0.0015, 0.003, 0.006]; // radii in degrees (approx larger buffers)
  const zonationColors = ['#ff6b6b', '#4ecdc4', '#45b7d1']; // Different colors for zones

  zonationRadii.forEach((radius, index) => {
    L.circle(loc.coords, {
      color: zonationColors[index],
      fillColor: zonationColors[index],
      fillOpacity: 0.1,
      radius: radius * 111320, // Convert degrees to meters (approximate)
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);
  });

  // Mangrove density circles (from WebGIS data)
  const densityData = {
    'lantebung': 285.48,
    'lakkang': 396.18,
    'marana': 285.48,
    'rammang': 285.48,
    'binangasangkara': 285.48,
    'puntondo': 285.48,
    'laikang': 285.48,
    'tanakeke': 292.86
  };

  const density = densityData[loc.id] || 285.48;
  const densityRadius = (density / 400) * 0.004; // Scale density to radius (increased for visibility)

  L.circle(loc.coords, {
    color: '#2d6a4f',
    fillColor: '#52b788',
    fillOpacity: 0.3,
    radius: densityRadius * 111320,
    weight: 3
  }).bindPopup(`<b>${loc.name}</b><br>Density: ${density} ton/ha`).addTo(map);

  // Marker utama
  const mainMarker = L.circleMarker(loc.coords, {
    radius: 8,
    color: "#2d6a4f",
    fillColor: "#52b788",
    fillOpacity: 0.9
  })
    .bindPopup(createPopupContent(loc))
    .addTo(map);
  mainMarker.on('click', () => {
    setActiveLocationLabel(loc.id);
    map.flyTo(loc.coords, loc.zoom, { animate: true, duration: 1.2 });
  });

  // No map-based location labels — handled in-panel instead.

  // Initialize empty array for image markers
  imageMarkers[loc.id] = [];
});

// No map label cleanup necessary since we're not adding map-based labels.

// =========================
// OBSERVER UNTUK INTERAKSI SCROLL
// =========================
const sections = document.querySelectorAll("section.story");

// Atur posisi panel bergantian kiri-kanan secara dinamis
// All panels should remain on the left side for consistent layout
sections.forEach((section) => {
  section.classList.add("left");
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        const loc = locations.find((l) => l.id === id);

        // Update status visual
        sections.forEach((s) => s.classList.remove("active"));
        entry.target.classList.add("active");

        // Jika lokasi ditemukan, arahkan peta
        if (loc) {
          map.flyTo(loc.coords, loc.zoom, {
            animate: true,
            duration: 2.5
          });
          // show only one label at a time (for the active location)
          setActiveLocationLabel(loc.id);
        }
      }
    });
  },
  {
    threshold: 0.5 // aktif jika 50% panel terlihat
  }
);

// Create a label marker for a given location id (not added to map yet)
// Previously created map labels — we no longer use map-based label markers.
// Keep a placeholder if we may reintroduce it in future.
function createLabelMarkerFor(loc) {
  return null;
}

// Show only one active location label at a time
function setActiveLocationLabel(id) {
  try {
    // Remove active class from any prior photo labels
    document.querySelectorAll('.photo-label').forEach(el => {
      el.classList.remove('photo-label-active');
    });

    const loc = locations.find(l => l.id === id);
    if (!loc) return;

    // Update the DOM for the active section's small photo label
    const sec = document.getElementById(id);
    if (!sec) return;
    const photoLabel = sec.querySelector('.photo-label');
    if (photoLabel) {
      photoLabel.innerText = loc.name.split(',')[0] || loc.name;
      photoLabel.classList.add('photo-label-active');
    }
  } catch(e) {
    console.error('setActiveLocationLabel error', e);
  }
}

// Observasi tiap section
sections.forEach((sec) => observer.observe(sec));

// =========================
// PDF PREVIEW FUNCTIONALITY
// =========================
document.addEventListener('DOMContentLoaded', () => {
  const pdfButtons = document.querySelectorAll('.pdf-preview-btn');
  const pdfContainer = document.getElementById('pdf-preview-container');
  const pdfIframe = document.getElementById('pdf-iframe');
  const closeBtn = document.getElementById('close-pdf-preview');

  // Map of location ids to actual PDF paths (folder names and filenames)
  const pdfMap = {
    lantebung: 'images/lantebung/Preview Analisis.pdf',
    lakkang: 'images/lakkang/Preview Analisis.pdf',
    marana: 'images/marana/Preview Analisis.pdf',
    rammang: 'images/rammang/Preview Analisis.pdf',
    binangasangkara: 'images/binasangkara/Preview Analisis.pdf',
    puntondo: 'images/puntondo/Preview Analisis.pdf',
    laikang: 'images/laikang/Preview Analisis.pdf',
    tanakeke: 'images/tanakeke/Preview Analisis.pdf'
  };

  pdfButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const location = e.target.getAttribute('data-location');
      // Use mapping with fallback to default pattern
      let pdfPath = pdfMap[location] || `images/${location}/Preview Analisis.pdf`;
      // Add PDF toolbar parameter
      if (pdfPath.indexOf('#') === -1) pdfPath += '#toolbar=0';

      pdfIframe.src = pdfPath;
      pdfContainer.style.display = 'block';

      // Disable zoom and scroll interactions on desktop, allow on mobile
      const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      if (!isMobile) {
        pdfIframe.addEventListener('wheel', (e) => e.preventDefault());
        pdfIframe.addEventListener('gesturestart', (e) => e.preventDefault());
        pdfIframe.addEventListener('gesturechange', (e) => e.preventDefault());
        pdfIframe.addEventListener('gestureend', (e) => e.preventDefault());
      }
    });
  });

  closeBtn.addEventListener('click', () => {
    pdfContainer.style.display = 'none';
    pdfIframe.src = '';
  });

  // Mobile-specific map adjustments
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
  if (isMobile) {
    map.options.dragging = true;
    map.options.scrollWheelZoom = false; // Disable scroll zoom on mobile
    map.options.doubleClickZoom = true;
    map.options.boxZoom = false;
    map.options.keyboard = false;
    map.options.keyboardPanDelta = 0;
  }

  // Handle window resize for responsive behavior
  window.addEventListener('resize', () => {
    const newIsMobile = window.innerWidth <= 768;
    if (newIsMobile !== isMobile) {
      location.reload(); // Reload to apply new settings
    }
  });

  // =========================
  // Image captions & lightbox
  // =========================
  document.querySelectorAll('.gallery').forEach(gallery => {
    gallery.querySelectorAll('img').forEach(img => {
      // Skip if already wrapped
      if (img.parentElement.tagName.toLowerCase() === 'figure') return;

      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const filename = src.split('/').pop() || src;
      let name = (alt && alt.trim().length > 0) ? alt : filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      // remove suffix like '- Gambar 1' or 'Gambar 1' at the end
      name = name.replace(/\s*[-–—:\s]*Gambar\s*\d+\s*$/i, '').trim();

      // Create wrapper figure
      const fig = document.createElement('figure');
      fig.className = 'gallery-item';
      img.parentNode.insertBefore(fig, img);
      fig.appendChild(img);

      // Create caption
      const caption = document.createElement('figcaption');
      caption.className = 'image-caption';
      caption.innerText = name;
      fig.appendChild(caption);

      // Click to open full image in modal
      img.addEventListener('click', () => {
        openImageModal(src, name);
      });
    });
  });

  // Image modal element (append once)
  const openImageModal = (src, title) => {
    let modal = document.getElementById('image-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'image-modal';
      modal.innerHTML = `<div class="image-modal-backdrop" id="image-modal-backdrop"></div><div class="image-modal-content"><button id="image-modal-close" class="image-modal-close">×</button><img id="image-modal-img" src="" alt="modal image"><div id="image-modal-title" class="image-modal-title"></div></div>`;
      document.body.appendChild(modal);

      // Close handlers
      document.getElementById('image-modal-backdrop').addEventListener('click', () => modal.remove());
      document.getElementById('image-modal-close').addEventListener('click', () => modal.remove());
    }
    document.getElementById('image-modal-img').src = src;
    document.getElementById('image-modal-title').innerText = title || '';
  };

  // =========================
  // Gallery slider + autoplay
  // =========================
  function initGallerySlider(gallery) {

    if (!gallery) return;
    // if slider already exists, skip
    if (gallery.querySelector('.slider')) return;

    // Build image data array from all <img> in gallery
    const domImgs = Array.from(gallery.querySelectorAll('img'));
    const imageData = domImgs.map(img => ({ src: img.src, alt: img.alt || '' }));
    if (imageData.length === 0) return;

    // Build slider structure
    const slider = document.createElement('div');
    slider.className = 'slider';
    const container = document.createElement('div');
    container.className = 'container';
    const mainContainer = document.createElement('div');
    mainContainer.className = 'slider-main';

    const mainImg = document.createElement('img');
    mainImg.className = 'slider-main-img';
    mainImg.src = imageData[0].src;
    mainImg.alt = imageData[0].alt || '';
    mainImg.setAttribute('loading', 'lazy'); // Add lazy loading for faster initial load
    mainContainer.appendChild(mainImg);

    const controls = document.createElement('div');
    controls.className = 'slider-controls';
    const prev = document.createElement('button');
    prev.className = 'slider-prev';
    prev.innerHTML = '◀';
    const next = document.createElement('button');
    next.className = 'slider-next';
    next.innerHTML = '▶';
    controls.appendChild(prev);
    controls.appendChild(next);
    mainContainer.appendChild(controls);

    // caption below main image
      // header overlay on main image + caption below
      const mainHead = document.createElement('div');
      mainHead.className = 'head';
      const mainHeadTitle = document.createElement('h2');
        mainHeadTitle.innerText = imageData[0].alt || '';
      const mainHeadMeta = document.createElement('p');
      mainHeadMeta.innerText = 'Foto lokasi';
      mainHead.appendChild(mainHeadTitle);
      mainHead.appendChild(mainHeadMeta);
      mainContainer.appendChild(mainHead);
    const mainCaption = document.createElement('div');
    mainCaption.className = 'slider-main-caption';
    mainCaption.innerText = (imageData[0].alt || imageData[0].src.split('/').pop()).replace(/\.[^.]+$/, '').replace(/[-_]/g,' ');
    mainContainer.appendChild(mainCaption);

    container.appendChild(mainContainer);

    // We intentionally do not render multiple large images below the main image.
    // The slider will present a single main image without overlay thumbnail
    // (the other images remain in memory for swapping only).
    slider.appendChild(container);

    // Make slider focusable for keyboard navigation
    slider.tabIndex = 0;
    // Replace existing gallery content with slider
    gallery.innerHTML = '';
    gallery.appendChild(slider);

    let index = 0;
    const total = imageData.length;
    let autoplayTimer = null;

    // Determine the panel title (closest .story-panel > h2) so we can avoid duplicates
    const panelTitleEl = gallery.closest('.story-panel') ? gallery.closest('.story-panel').querySelector('h2') : null;
    const panelTitleText = panelTitleEl ? (panelTitleEl.innerText || '').trim() : '';

    function update(index) {
      mainImg.src = imageData[index].src;
      mainImg.alt = imageData[index].alt || '';
      mainCaption.innerText = (imageData[index].alt || imageData[index].src.split('/').pop()).replace(/\.[^.]+$/, '').replace(/[-_]/g,' ');
      mainHeadTitle.innerText = imageData[index].alt || '';
      // hide overlay title if it duplicates the panel H2 title
      if (panelTitleText && (mainHeadTitle.innerText || '').trim() === panelTitleText.trim()) {
        mainHeadTitle.style.display = 'none';
      } else {
        mainHeadTitle.style.display = '';
      }
      // Preload next image for faster navigation
      const nextIndex = (index + 1) % total;
      const preloadImg = new Image();
      preloadImg.src = imageData[nextIndex].src;
    }

    function nextSlide() { index = (index + 1) % total; triggerSwapAnimation(); update(index); }
    function prevSlide() { index = (index - 1 + total) % total; triggerSwapAnimation(); update(index); }

    // controls
    next.addEventListener('click', () => { nextSlide(); resetTimer(); });
    prev.addEventListener('click', () => { prevSlide(); resetTimer(); });

    // main image click opens modal preview
    mainImg.addEventListener('click', () => {
      openImageModal(mainImg.src, mainImg.alt || '');
    });

    // swipe gesture on mainContainer for mobile to change slides
    let touchStartX = null;
    mainContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    mainContainer.addEventListener('touchend', (e) => {
      if (!touchStartX) return;
      const touchEndX = (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : null;
      if (touchEndX === null) return;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide(); else prevSlide();
        resetTimer();
      }
      touchStartX = null;
    });

    // autoplay
    const startTimer = () => {
      autoplayTimer = setInterval(nextSlide, 4000);
    };
    const stopTimer = () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    };
    const resetTimer = () => { stopTimer(); startTimer(); };

    slider.addEventListener('mouseenter', stopTimer);
    slider.addEventListener('mouseleave', startTimer);
    // keyboard navigation
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { nextSlide(); resetTimer(); }
      if (e.key === 'ArrowLeft') { prevSlide(); resetTimer(); }
    });

    function triggerSwapAnimation() {
      mainContainer.classList.add('swap-anim');
      setTimeout(() => {
        mainContainer.classList.remove('swap-anim');
      }, 350);
    }

    startTimer();
  }

  // init sliders for all galleries
  document.querySelectorAll('.gallery').forEach(g => initGallerySlider(g));
});

// =========================
// LOAD AWAL (LANTEBUNG)
// =========================
window.addEventListener("load", () => {
  const start = locations[0];
  map.setView(start.coords, start.zoom);
  document.querySelector(`#${start.id}`).classList.add("active");
  // ensure first location label is shown
  setActiveLocationLabel(start.id);
});
