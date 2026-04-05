const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001;
const PYTHON_API = 'http://localhost:5001/api';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// =========================
// PROXY A PYTHON
// =========================
app.post('/api/analyze', async (req, res) => {
    try {
        console.log('📥 Node recibió petición de análisis');
        
        // Reenviar la petición a Python
        const formData = req.body;
        
        // Necesitamos axios para hacer la petición a Python
        const response = await axios.post(`${PYTHON_API}/analyze`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        console.log('✅ Respuesta de Python:', response.data);
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Error en Node:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

const multer = require('multer');
const upload = multer(); // Para procesar archivos en Node


app.get('/api/search', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API}/search`, {
            params: req.query
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API}/stats`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/view-cv/:filename', async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API}/view-cv/${req.params.filename}`, {
            responseType: 'stream'
        });
        response.data.pipe(res);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================
// RUTAS PARA CANDIDATES
// =========================
app.get('/api/candidates', async (req, res) => {
    try {
        console.log('📥 Node: GET /api/candidates');
        const response = await axios.get(`${PYTHON_API}/candidates`);
        console.log('✅ Node: Respuesta de Python:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Node: Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        console.log('📥 Node: GET /api/stats');
        const response = await axios.get(`${PYTHON_API}/stats`);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Node: Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================
// SERVIDOR
// =========================
app.listen(PORT, () => {
    console.log(`✅ Node.js server en http://localhost:${PORT}`);
});


