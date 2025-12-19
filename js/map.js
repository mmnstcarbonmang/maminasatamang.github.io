// ======================
// Basemap Dropdown Menu (Sidebar Kanan)
// ======================
const initSidebarBasemapDropdown = function() {
  const basemapToggleBtn = document.getElementById('btn-basemap-toggle-sidebar');
  const basemapMenu = document.getElementById('basemap-menu-sidebar');
  if(!basemapToggleBtn || !basemapMenu) return;
  basemapMenu.classList.remove('active');
  basemapToggleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    basemapMenu.classList.toggle('active');
  });
  document.addEventListener('click', function(event) {
    if(!basemapToggleBtn.contains(event.target) && !basemapMenu.contains(event.target)) {
      basemapMenu.classList.remove('active');
    }
  });
  basemapMenu.querySelectorAll('.basemap-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      const basemapType = this.dataset.basemap;
      const basemapSelectRight = document.getElementById('basemap-select-right');
      if(basemapSelectRight) {
        basemapSelectRight.value = basemapType;
        basemapSelectRight.dispatchEvent(new Event('change'));
      }
      basemapMenu.classList.remove('active');
    });
  });
};
// ======================
// Inisialisasi Peta Dasar
// ======================
var map = L.map('map', { zoomControl: false }).setView([-5.1688921,119.4916234], 10);

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ======================
// Fungsi warna berdasarkan kttj
// ======================
function getMangroveColor(kttj) {
  switch (kttj) {
    case "Mangrove Lebat":
    case "Lebat":
      return "#2ecc40"; // Hijau tua
    case "Mangrove Sedang":
    case "Sedang":
      return "#a4e69b"; // Hijau muda
    case "Mangrove Jarang":
    case "Jarang":
      return "#f3ffbd"; // Kuning muda
    default:
      return "#e0e0e0";
  }
}

// ======================
// Layer untuk geojson mangrove dan interaksi
// ======================
var mangroveLayer;

// ======================
// Feature Group untuk draw control
// ======================
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// ======================
// Setup Leaflet Draw Control dengan fitur lengkap
// ======================
var drawControl = new L.Control.Draw({
  position: 'topright',
  draw: {
    polygon: {
      allowIntersection: false,
      showArea: true,
      shapeOptions: {
        color: '#278428',
        fillOpacity: 0.3
      }
    },
    polyline: {
      shapeOptions: {
        color: '#278428'
      }
    },
    rectangle: false,
    circle: false,
    marker: false,
    circlemarker: false
  },
  edit: {
    featureGroup: drawnItems,
    remove: true
  }
});
map.addControl(drawControl);

// Handling event saat gambar selesai dibuat
map.on(L.Draw.Event.CREATED, function (e) {
  var layer = e.layer;
  drawnItems.addLayer(layer);
  layer.bindPopup('Objek gambar baru, dapat diedit atau dihapus.');
});

// ======================
// Fungsi Load GeoJSON (default dan hasil upload)
// ======================
function loadGeojsonSource(source, isUpload = false) {
  if (mangroveLayer) map.removeLayer(mangroveLayer);
  if (!source) return;

  // Upload file menggunakan browser (File API)
  if (isUpload) {
    mangroveLayer = L.geoJSON(source, {
      style: function(feature) {
        var kttj = feature.properties.kttj;
        return {
          color: '#313a29',
          weight: 0.7,
          fillColor: getMangroveColor(kttj),
          fillOpacity: 0.73
        };
      },
      onEachFeature: onEachMangroveFeature
    }).addTo(map);
    updateSummaryTable(source);
  } else {
    fetch(source)
      .then(res => res.json())
      .then(data => {
        mangroveLayer = L.geoJSON(data, {
          style: function(feature) {
            var kttj = feature.properties.kttj;
            return {
              color: '#313a29',
              weight: 0.7,
              fillColor: getMangroveColor(kttj),
              fillOpacity: 0.73
            };
          },
          onEachFeature: onEachMangroveFeature
        }).addTo(map);
        updateSummaryTable(data);
      });
  }
}

// Detail popup setiap fitur
function onEachMangroveFeature(feature, layer) {
  var p = feature.properties;
  var html = `<b>Wilayah:</b> ${p.kab || "-"}<br/>
              <b>Kelas Kerapatan:</b> ${p.kttj || "-"}<br/>
              <b>Luas:</b> ${p.lsmgr ? (p.lsmgr.toLocaleString('id') + ' ha') : '-'}<br/>`;
  if (p.valuasi_ekonomi)
    html += `<b>Valuasi Ekonomi:</b> Rp ${parseInt(p.valuasi_ekonomi).toLocaleString('id')}`;
  layer.bindPopup(html);
  layer.on('mouseover', function(){ layer.openPopup(); });
  layer.on('mouseout', function(){ layer.closePopup(); });
}

// Update ringkasan summary pada tabel bawah peta
function updateSummaryTable(geojsonData){
  let features = geojsonData.features || geojsonData;
  let totalLuas = 0, wilayah = "-", totalLebat=0, totalSedang=0, totalJarang=0;
  features.forEach(f => {
    let p = f.properties;
    totalLuas += parseFloat(p.lsmgr || 0);
    if (!wilayah && p.kab) wilayah = p.kab;
    // Count jenis kerapatan
    if(/lebat/i.test(p.kttj)) totalLebat++; 
    else if(/sedang/i.test(p.kttj)) totalSedang++; 
    else if(/jarang/i.test(p.kttj)) totalJarang++;
  });
  document.getElementById('tbl-wilayah').innerText = wilayah || "Semua";
  document.getElementById('tbl-keterangan').innerHTML = `Lebat: <b>${totalLebat}</b>, Sedang: <b>${totalSedang}</b>, Jarang: <b>${totalJarang}</b>`;
  document.getElementById('tbl-agc').innerText = "-";
  document.getElementById('tbl-ekonomi').innerText = "-";
  document.getElementById('tbl-luas').innerText = totalLuas.toLocaleString('id') + ' ha';
}

// ======================
// Load geojson utama MangroveKLHK
// ======================
fetch('data/MangroveKLHK.geojson')
  .then(res => res.json())
  .then(data => {
    allMangroveData = data;
    filterByWilayah('semua'); // Load semua data awalnya
  });

// ======================
// Upload File GeoJSON
// ======================
document.getElementById('geojson-upload').addEventListener('change', function(e){
  let file = e.target.files[0];
  if(!file) return;
  let reader = new FileReader();
  reader.onload = function(ev){
    let geojson = JSON.parse(ev.target.result);
    // Upload langsung ditampilkan tanpa filter
    if(filteredLayer) map.removeLayer(filteredLayer);
    
    filteredLayer = L.geoJSON(geojson, {
      style: function(feature) {
        var kttj = feature.properties.kttj;
        return {
          color: '#313a29',
          weight: 0.7,
          fillColor: getMangroveColor(kttj),
          fillOpacity: 0.73
        };
      },
      onEachFeature: onEachMangroveFeature
    }).addTo(map);
    
    updateSummaryTable(geojson);
  };
  reader.readAsText(file);
});

// ======================
// Fungsi untuk menampilkan informasi luasan mangrove di tabel
// ======================
function updateKerapatanInfo(geojsonData) {
  let lebat = 0, sedang = 0, jarang = 0;
  let features = geojsonData.features || geojsonData;
  
  features.forEach(f => {
    let kttj = f.properties.kttj || '';
    let luas = parseFloat(f.properties.lsmgr || 0);
    
    if(/lebat/i.test(kttj)) lebat += luas;
    else if(/sedang/i.test(kttj)) sedang += luas;
    else if(/jarang/i.test(kttj)) jarang += luas;
  });
  
  let total = lebat + sedang + jarang;
  let maxLuas = Math.max(lebat, sedang, jarang);
  let html = '';
  
  // Lebat
  let persenLebat = total > 0 ? ((lebat/total)*100) : 0;
  let barWidthLebat = total > 0 ? persenLebat : 0; // use percentage of total for bar width
  html += `<tr>
    <td>
      <div class="kerapatan-name">
        <div class="color-indicator" style="background: #2ecc40;"></div>
        <span>Lebat</span>
      </div>
    </td>
    <td class="luas-value">${lebat.toLocaleString('id', {maximumFractionDigits: 2})}</td>
    <td class="persen-value">${persenLebat.toFixed(1)}%</td>
    <td>
      <div class="bar-container">
        <div class="bar bar-lebat" style="width: ${barWidthLebat.toFixed(1)}%;">${persenLebat > 15 ? persenLebat.toFixed(1) + '%' : ''}</div>
      </div>
    </td>
  </tr>`;
  
  // Sedang
  let persenSedang = total > 0 ? ((sedang/total)*100) : 0;
  let barWidthSedang = total > 0 ? persenSedang : 0;
  html += `<tr>
    <td>
      <div class="kerapatan-name">
        <div class="color-indicator" style="background: #a4e69b;"></div>
        <span>Sedang</span>
      </div>
    </td>
    <td class="luas-value">${sedang.toLocaleString('id', {maximumFractionDigits: 2})}</td>
    <td class="persen-value">${persenSedang.toFixed(1)}%</td>
    <td>
      <div class="bar-container">
        <div class="bar bar-sedang" style="width: ${barWidthSedang.toFixed(1)}%;">${persenSedang > 15 ? persenSedang.toFixed(1) + '%' : ''}</div>
      </div>
    </td>
  </tr>`;
  
  // Jarang
  let persenJarang = total > 0 ? ((jarang/total)*100) : 0;
  let barWidthJarang = total > 0 ? persenJarang : 0;
  html += `<tr>
    <td>
      <div class="kerapatan-name">
        <div class="color-indicator" style="background: #f3ffbd;"></div>
        <span>Jarang</span>
      </div>
    </td>
    <td class="luas-value">${jarang.toLocaleString('id', {maximumFractionDigits: 2})}</td>
    <td class="persen-value">${persenJarang.toFixed(1)}%</td>
    <td>
      <div class="bar-container">
        <div class="bar bar-jarang" style="width: ${barWidthJarang.toFixed(1)}%;">${persenJarang > 15 ? persenJarang.toFixed(1) + '%' : ''}</div>
      </div>
    </td>
  </tr>`;
  
  document.getElementById('kerapatan-table-body').innerHTML = html;
}

// Tambahkan label "Aespace Project" di dekat attribution (kanan bawah)
map.whenReady(function(){
  try{
    var attr = document.querySelector('.leaflet-control-attribution');
    if(attr && !attr.querySelector('.aespace-attrib')){
      var span = document.createElement('span');
      span.className = 'aespace-attrib';
      span.style.marginLeft = '10px';
      span.style.fontWeight = '600';
      span.style.color = 'rgba(0,0,0,0.6)';
      span.textContent = 'Aespace Project';
      attr.appendChild(span);
    }
  }catch(e){ console.warn('Could not append Aespace attribution', e); }
});

// ======================
// Layer Lokasi (Habitat Mangrove)
// ======================
var lokasiLayer;

// Pemetaan gambar untuk setiap lokasi
const lokasiImages = {
  'Lantebung': [
    'images/lantebung/Foto Udara.jpg',
    'images/lantebung/Titik Sampel 1.jpg',
    'images/lantebung/Titik Sampel 2.jpg'
  ],
  'Lakkang': [
    'images/lakkang/Foto Udara.png',
    'images/lakkang/Tampak Atas.jpg',
    'images/lakkang/Titik Sampel 1.png'
  ],
  'Marana': [
    'images/marana/Foto Udara 1.png',
    'images/marana/Titik Sampel 1.jpg',
    'images/marana/Titik Sampel 2.jpg'
  ],
  'Rammang-Rammang': [
    'images/rammang/Rammang Rammang.jpg',
    'images/rammang/Titik Sampel 1.jpg',
    'images/rammang/Titik Sampel 2.jpg'
  ],
  'Muara Binangasangkara': [
    'images/binasangkara/Mangrove.jpg',
    'images/binasangkara/Foto Udara.png',
    'images/binasangkara/Titik Sampel 1.jpg'
  ],
  'Pantai Puntondo': [
    'images/puntondo/Foto Udara.png',
    'images/puntondo/Mangrove.png',
    'images/puntondo/Titik Sampel 1.jpg'
  ],
  'Teluk Laikang': [
    'images/laikang/Foto Udara 1.png',
    'images/laikang/Titik Sampel 1.jpg',
    'images/laikang/Titik Sampel 2.jpg'
  ],
  'Pulau Tanakeke': [
    'images/tanakeke/Foto Udara.jpg',
    'images/tanakeke/Titik Sampel 1.png',
    'images/tanakeke/Titik Sampel 2.png'
  ]
};

// Data dari ketiga grafik untuk setiap lokasi
const lokasiData = {
  'Lantebung': {
    co2e: 3.0819921096,
    karbon: 0.0010506696,
    organikC: 285.4807473
  },
  'Lakkang': {
    co2e: 7.5129478975,
    karbon: 0.0025394730,
    organikC: 396.1820824
  },
  'Marana': {
    co2e: 2.6947088833,
    karbon: 0.0007578488,
    organikC: 285.4807473
  },
  'Rammang-Rammang': {
    co2e: 5.5068781109,
    karbon: 0.0034851617,
    organikC: 285.4807473
  },
  'Muara Binangasangkara': {
    co2e: 3.6749471381,
    karbon: 0.0010022492,
    organikC: 285.4807473
  },
  'Pantai Puntondo': {
    co2e: 6.1510530939,
    karbon: 0.0016775447,
    organikC: 285.4807473
  },
  'Teluk Laikang': {
    co2e: 3.3604298866,
    karbon: 0.0009164725,
    organikC: 285.4807473
  },
  'Pulau Tanakeke': {
    co2e: 4.1609279640,
    karbon: 0.0011523559,
    organikC: 292.8608363
  }
};

// Simpan data lokasi global untuk filter
var allLokasiData = null;
function loadLokasiLayer(selectedWilayah = 'semua') {
  if(lokasiLayer) map.removeLayer(lokasiLayer);
  // Ambil data jika belum ada
  if (!allLokasiData) {
    fetch('data/lokasi_habitat.geojson')
      .then(res => res.json())
      .then(data => {
        allLokasiData = data;
        renderLokasiLayer(selectedWilayah);
      })
      .catch(err => console.log('Error loading lokasi layer:', err));
  } else {
    renderLokasiLayer(selectedWilayah);
  }
}

function renderLokasiLayer(selectedWilayah = 'semua') {
  if(lokasiLayer) map.removeLayer(lokasiLayer);
  let filteredData = {...allLokasiData};
  if(selectedWilayah !== 'semua') {
    let kabupatenMap = {
      'makassar': 'Makassar',
      'takalar': 'Takalar',
      'maros': 'Maros'
    };
    let selectedKabupaten = kabupatenMap[selectedWilayah] || selectedWilayah;
    filteredData.features = allLokasiData.features.filter(f => {
      return f.properties.kabupaten && f.properties.kabupaten.toLowerCase().includes(selectedKabupaten.toLowerCase());
    });
  }
  lokasiLayer = L.geoJSON(filteredData, {
    pointToLayer: function(feature, latlng) {
      var p = feature.properties;
      var namaLokasi = p.nama || 'Lokasi';
      // Zonasi melingkar transparan (radius ~1.5km)
      var circle = L.circle(latlng, {
        radius: 1500, // meter
        color: '#1abb3c',
        weight: 2,
        opacity: 0.3,
        fillColor: '#1abb3c',
        fillOpacity: 0.08,
        dashArray: '5, 5'
      });
      // Label nama lokasi
      var label = L.marker(latlng, {
        icon: L.divIcon({
          className: 'lokasi-label',
          html: `<div style="background: linear-gradient(135deg, #1abb3c, #0f4c23);color: white;padding: 6px 12px;border-radius: 20px;font-weight: 700;font-size: 12px;white-space: nowrap;box-shadow: 0 2px 8px rgba(0,0,0,0.4);border: 2px solid white;">${namaLokasi}</div>`,
          iconSize: [null, null],
          iconAnchor: [0, 0]
        })
      });
      // Titik pusat lokasi
      var centerPoint = L.circleMarker(latlng, {
        radius: 8,
        fillColor: '#1abb3c',
        color: '#0f4c23',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.9
      });
      var group = L.featureGroup([circle, label, centerPoint]);
      group.addTo(map);
      centerPoint.addTo(map);
      return centerPoint;
    },
    onEachFeature: function(feature, layer) {
      var p = feature.properties;
      var namaLokasi = p.nama || 'Lokasi';
      var dataLokasi = lokasiData[namaLokasi] || {};
      var html = `<div style="width: 320px; padding: 0;">`;
      html += `<div style="background: linear-gradient(135deg, #1abb3c, #0f4c23); color: white; padding: 12px; border-radius: 8px 8px 0 0; margin: -12px -12px 10px -12px;"><h3 style="margin: 0; font-size: 16px; font-weight: 700;">${namaLokasi}</h3></div>`;
      html += `<div style="padding: 0 10px;">`;
      if(p.kabupaten) html += `<p style="margin: 8px 0; font-size: 13px;"><b>Kabupaten:</b> ${p.kabupaten}</p>`;
      if(p.luas) html += `<p style="margin: 8px 0; font-size: 13px;"><b>Luas:</b> ${p.luas}</p>`;
      if(p.koordinat) html += `<p style="margin: 8px 0; font-size: 11px; color: #666;"><b>Koordinat:</b> ${p.koordinat}</p>`;
      html += `<div style="margin-top: 12px; border-top: 2px solid #1abb3c; padding-top: 12px;">`;
      html += `<div style="background: rgba(26, 187, 60, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 8px;">`;
      html += `<p style="margin: 5px 0; font-size: 12px;"><b>🌿 CO2e:</b> <span style="color: #1abb3c; font-weight: 700;">${(dataLokasi.co2e || 0).toFixed(4)} Ton</span></p>`;
      html += `<p style="margin: 5px 0; font-size: 12px;"><b>💾 Karbon Tersimpan:</b> <span style="color: #1abb3c; font-weight: 700;">${(dataLokasi.karbon || 0).toFixed(10)} Ton</span></p>`;
      html += `<p style="margin: 5px 0; font-size: 12px;"><b>🌱 C-Organik:</b> <span style="color: #1abb3c; font-weight: 700;">${(dataLokasi.organikC || 0).toFixed(2)} ton/ha</span></p>`;
      html += `</div>`;
      html += `</div>`;
      var images = lokasiImages[namaLokasi] || [];
      if(images.length > 0) {
        html += `<div style="margin-top: 12px; border-top: 2px solid #ddd; padding-top: 12px;">`;
        html += `<p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #333;">📸 Galeri Foto:</p>`;
        images.forEach(function(imgPath, idx) {
          html += `<img src="${imgPath}" alt="Foto ${namaLokasi} ${idx+1}" style="width: 100%; height: auto; margin-bottom: 8px; border-radius: 4px; cursor: pointer; transition: transform 0.3s; border: 1px solid #ddd;" onmouseover="this.style.transform='scale(1.05)'; this.style.borderColor='#1abb3c'" onmouseout="this.style.transform='scale(1)'; this.style.borderColor='#ddd'">`;
        });
        html += `</div>`;
      }
      html += `</div></div>`;
      var getPopupWidth = function() {
        var zoom = map.getZoom();
        if(zoom >= 17) return 520;
        if(zoom >= 15) return 460;
        if(zoom >= 13) return 420;
        return 380;
      };
      layer.bindPopup(html, {
        maxWidth: getPopupWidth(),
        className: 'lokasi-popup'
      });
      map.on('zoomend', function() {
        if(layer.getPopup() && layer.getPopup().isOpen()) {
          var popup = layer.getPopup();
          popup.options.maxWidth = getPopupWidth();
          popup.update();
        }
      });
      layer.on('popupopen', function() {
        var latlng = layer.getLatLng();
        map.flyTo(latlng, 16, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      });
    }
  }).addTo(map);
  if (lokasiLayer && lokasiLayer.bringToFront) {
    lokasiLayer.bringToFront();
  }
}

// ======================
// Filter Wilayah (Kabupaten)
// ======================
var allMangroveData = null;
var filteredLayer = null;

// Store semua data untuk filtering
fetch('data/MangroveKLHK.geojson')
  .then(res => res.json())
  .then(data => {
    allMangroveData = data;
    // Tampilkan informasi kerapatan saat pertama kali load
    updateKerapatanInfo(data);
  });

function filterByWilayah(selectedWilayah) {
  if(!allMangroveData) return;
  
  if(filteredLayer) map.removeLayer(filteredLayer);
  if(mangroveLayer) map.removeLayer(mangroveLayer);
  
  let filteredData = {...allMangroveData};
  
  if(selectedWilayah !== 'semua') {
    // Map nilai select ke nama kabupaten sesuai data
    let kabupatenMap = {
      'makassar': 'Makassar',
      'takalar': 'Takalar',
      'maros': 'Maros'
    };
    
    let selectedKabupaten = kabupatenMap[selectedWilayah] || selectedWilayah;
    
    filteredData.features = allMangroveData.features.filter(f => {
      return f.properties.kab && f.properties.kab.toLowerCase().includes(selectedKabupaten.toLowerCase());
    });
  }
  
  if(filteredData.features.length > 0) {
    filteredLayer = L.geoJSON(filteredData, {
      style: function(feature) {
        var kttj = feature.properties.kttj;
        return {
          color: '#313a29',
          weight: 0.7,
          fillColor: getMangroveColor(kttj),
          fillOpacity: 0.73
        };
      },
      onEachFeature: onEachMangroveFeature
    }).addTo(map);
    
    updateSummaryTable(filteredData);
    updateKerapatanInfo(filteredData);
  } else {
    updateSummaryTable({features: []});
    updateKerapatanInfo({features: []});
  }
}

document.getElementById('wilayah').addEventListener('change', function(){
  const selected = this.value;
  filterByWilayah(selected);
  loadLokasiLayer(selected);
});

// ======================
// Layer Control Checkbox
// ======================
document.getElementById('agc-layer').addEventListener('change', function(){
  if(filteredLayer) {
    if(this.checked) map.addLayer(filteredLayer);
    else map.removeLayer(filteredLayer);
  }
});

document.getElementById('lokasi-layer').addEventListener('change', function(){
  if(this.checked) {
    if(!lokasiLayer) {
      loadLokasiLayer();
    } else {
      map.addLayer(lokasiLayer);
      if (lokasiLayer.bringToFront) lokasiLayer.bringToFront();
    }
  } else {
    if(lokasiLayer) map.removeLayer(lokasiLayer);
  }
});

// ======================
// Toolbar Interaktif
// ======================
document.getElementById('btn-zoomin').onclick = () => map.zoomIn();
document.getElementById('btn-zoomout').onclick = () => map.zoomOut();
document.getElementById('btn-extent').onclick = () => map.setView([-5.1688921,119.4916234], 10);

// Tombol draw foreground polyline (garis)
document.getElementById('btn-measure').onclick = () => {
  var polylineDrawer = new L.Draw.Polyline(map, {
    shapeOptions: { color: '#00ff00' }
  });
  polylineDrawer.enable();
};

// Tombol draw polygon
document.getElementById('btn-draw-polygon').onclick = () => {
  var polygonDrawer = new L.Draw.Polygon(map, {
    allowIntersection: false,
    shapeOptions: { color: '#6633cc', fillOpacity: 0.3 }
  });
  polygonDrawer.enable();
};

// Tombol pan dengan alert info
document.getElementById('btn-pan').onclick = () => alert('Gunakan mouse drag untuk berpindah peta.');

// ======================
// Sidebar Tab Switching
// ======================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = function() {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  }
});

// ======================
// Download CSV & GeoJSON (Ekspor data kerapatan)
// Download buttons removed from UI; export handlers disabled.

// ======================
// Panel Kontrol (Hide/Show, Resize)
// ======================
var tableIsCompact = false;
var tableIsHidden = false;

// Summary panel controls removed (no hide/resize buttons)

// btn-show-panels removed from DOM; safeInitAll will handle initialization instead

// ======================
// Kontrol Sidebar Dashboard (Hide/Show)
// ======================
const btnHideSidebar = document.getElementById('btn-hide-sidebar');
if(btnHideSidebar) {
  btnHideSidebar.addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar-dashboard');
    if(sidebar) sidebar.classList.add('hidden');
  });
}

const btnShowSidebar = document.getElementById('btn-show-sidebar');
if(btnShowSidebar) {
  btnShowSidebar.addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar-dashboard');
    if(sidebar) sidebar.classList.remove('hidden');
  });
}

// ======================
// Kontrol Basemap
// ======================
const basemaps = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© OpenTopoMap'
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: '© Esri'
  })
};
// Helper to set basemap programmatically
function setBasemap(basemapType) {
  if(!basemapType || !basemaps[basemapType]) return;
  // Remove existing tile layers
  map.eachLayer(function(layer) {
    if(layer instanceof L.TileLayer && layer._url) {
      map.removeLayer(layer);
    }
  });
  // Add chosen basemap
  basemaps[basemapType].addTo(map);
}

// Initialize basemap control (tries to use hidden select if present)
const initBasemapControl = function() {
  const basemapSelectRight = document.getElementById('basemap-select-right');

  // ensure map has a basemap
  setBasemap('osm');

  if(!basemapSelectRight) {
    console.warn('basemap-select-right not found; basemap select control disabled');
    return;
  }

  basemapSelectRight.value = 'osm'; // Set initial value

  basemapSelectRight.addEventListener('change', function(e) {
    const basemapType = e.target.value;
    setBasemap(basemapType);
  });
};

// Initialize basemap control when DOM is ready
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBasemapControl);
} else {
  initBasemapControl();
}

// ======================
// Basemap Dropdown Menu (Toolbar Kanan)
// ======================
const initBasemapDropdown = function() {
  const dropdowns = document.querySelectorAll('.basemap-dropdown');
  const basemapItems = document.querySelectorAll('.basemap-item');

  if(!dropdowns || dropdowns.length === 0) {
    console.warn('No basemap dropdowns found');
    return;
  }

  // Wire each dropdown's toggle and menu
  dropdowns.forEach(dd => {
    const toggleBtn = dd.querySelector('button');
    const menu = dd.querySelector('.basemap-menu');
    if(!toggleBtn || !menu) return;

    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // close other menus
      document.querySelectorAll('.basemap-menu.active').forEach(m => { if(m !== menu) m.classList.remove('active'); });
      menu.classList.toggle('active');
    });
  });

  // Close any open basemap menus when clicking outside
  document.addEventListener('click', function(event) {
    document.querySelectorAll('.basemap-menu.active').forEach(m => {
      const parent = m.closest('.basemap-dropdown');
      if(parent && !parent.contains(event.target)) m.classList.remove('active');
    });
  });

  // Global item click handler (all items share class)
  basemapItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      const basemapType = this.dataset.basemap;
      // Apply basemap immediately
      try { setBasemap(basemapType); } catch(err) { console.warn('setBasemap error', err); }
      // Update hidden select if present (keeps state in sync)
      const basemapSelectRight = document.getElementById('basemap-select-right');
      if(basemapSelectRight) {
        basemapSelectRight.value = basemapType;
        basemapSelectRight.dispatchEvent(new Event('change'));
      }
      // close all menus
      document.querySelectorAll('.basemap-menu.active').forEach(m => m.classList.remove('active'));
    });
  });
};

// Initialize basemap dropdowns and lokasiLayer when DOM is ready
function safeInitAll() {
  try { initBasemapDropdown(); } catch(e) { console.warn('BasemapDropdown error', e); }
  try {
    const lokasiCheckbox = document.getElementById('lokasi-layer');
    if (lokasiCheckbox && !lokasiCheckbox.checked) {
      lokasiCheckbox.checked = true;
    }
    loadLokasiLayer('semua');
  } catch(e) { console.warn('LokasiLayer error', e); }
  // Inisialisasi ulang semua tombol utama jika perlu
  try {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      }
    });
  } catch(e) { console.warn('TabBtn error', e); }
}

if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitAll);
} else {
  safeInitAll();
}

