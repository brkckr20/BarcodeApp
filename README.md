# Barcode Okuma Uygulaması

MSSQL veritabanından barkod ile ürün sorgulama ve Excel export uygulaması.

## Kurulum

```bash
npm install
```

## Yapılandırma

`.env` dosyasını oluşturun:

```env
DB_SERVER=MSSQL_PATH
DB_NAME=VeritabaniAdi
DB_USER=sa
DB_PASSWORD=sifre
AUTH_TYPE=sql
EXPORT_PATH=Export_path
```

## Çalıştırma

```bash
npm start
```

## Ağ Erişimi

Aynı ağdaki cihazlardan erişmek için tarayıcıya şunu yazın:

```
http://<bilgisayar-ip>:3000
```

IP adresini öğrenmek için `ipconfig` komutunu kullanın.

## Özellikler

- Barkod sorgulama
- Otomatik adet artırma (aynı barkod tekrar okutulduğunda)
- Adet düzenleme (liste satırına tıklama)
- Excel (.xlsx) export
- Mobil uyumlu arayüz
- Yerel ağ erişimi
