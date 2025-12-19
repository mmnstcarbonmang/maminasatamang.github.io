const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for map page
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'map.html'));
});

// Route for storymaps page
app.get('/storymaps', (req, res) => {
  res.sendFile(path.join(__dirname, 'storymaps.html'));
});

// API endpoint for CO2e data
app.get('/api/co2e-data', (req, res) => {
  const co2eData = {
    labels: ['Lantebung', 'Lakkang', 'Marana', 'Rammang-Rammang', 'Binangasangkara', 'Puntondo', 'Laikang', 'Tanakeke'],
    data: [3.0819921096, 7.5129478975, 2.6947088833, 5.5068781109, 3.6749471381, 6.1510530939, 3.3604298866, 4.1609279640],
    storedCarbonData: [0.0010506696, 0.0025394730, 0.0007578488, 0.0034851617, 0.0010022492, 0.0016775447, 0.0009164725, 0.0011523559]
  };
  res.json(co2eData);
});

app.listen(port, () => {
  console.log(`Mangrove Carbon WebGIS server running at http://localhost:${port}`);
});
