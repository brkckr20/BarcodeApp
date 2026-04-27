require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

if (process.env.AUTH_TYPE === 'windows') {
    delete config.user;
    delete config.password;
    config.options.authentication = {
        authenticationOptions: {
            authenticationType: 'ntlm',
            options: {
                trustServerCertificate: true
            }
        }
    };
}

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('DB connected');
    } catch (err) {
        console.error('DB connection error:', err);
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/sorgula', async (req, res) => {
    try {
        const { barkod } = req.body;
        const result = await sql.query`
            SELECT IB.Barcode, I.InventoryName 
            FROM IM_Item I 
            LEFT JOIN IM_ItemBarcode IB ON I.RecId = IB.InventoryId 
            WHERE IB.Barcode = ${barkod}
        `;
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/liste-oku', async (req, res) => {
    try {
        const result = await sql.query`SELECT TOP 100 barkod, adi FROM urunler ORDER BY id DESC`;
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/export', async (req, res) => {
    try {
        const { liste, dosyaAdi } = req.body;
        if (!liste || liste.length === 0) {
            return res.json({ success: false, error: 'Liste boş' });
        }

        const exportPath = process.env.EXPORT_PATH || path.join(__dirname, 'exports');
        const date = new Date().toISOString().slice(0, 10);
        const time = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
        const name = dosyaAdi ? dosyaAdi.toUpperCase() : 'barkod';
        const fileName = `${name}_${date}_${time}.xlsx`;
        const filePath = path.join(exportPath, fileName);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Barkodlar');

        worksheet.columns = [
            { header: 'Barkod', key: 'barkod', width: 20 },
            { header: 'Ürün Adı', key: 'adi', width: 30 },
            { header: 'Adet', key: 'adet', width: 10 }
        ];

        liste.forEach(item => {
            worksheet.addRow({
                barkod: item.barkod,
                adi: item.adi,
                adet: item.adet
            });
        });

        if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
        }

        await workbook.xlsx.writeFile(filePath);

        res.json({ success: true, file: fileName, path: filePath });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

connectDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});