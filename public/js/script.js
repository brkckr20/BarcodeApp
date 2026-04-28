let liste = [];

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('barkodInput');
    const sorgulaBtn = document.getElementById('sorgulaBtn');
    const sonuc = document.getElementById('sonuc');
    const listeDiv = document.getElementById('liste');
    const menuBtns = document.querySelectorAll('.menu-btn');

    input.focus();

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sorgula();
        }
    });

    sorgulaBtn.addEventListener('click', sorgula);

    async function sorgula() {
        const barkod = input.value.trim().toUpperCase();
        if (!barkod) return;

        sonuc.innerHTML = '<p>İşleniyor...</p>';

        try {
            const res = await fetch('/api/sorgula', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barkod })
            });
            const data = await res.json();

            if (data.success && data.data.length > 0) {
                const urun = data.data[0];
                const mevcut = liste.find(x => x.barkod.toUpperCase() === urun.Barcode.toUpperCase());

                if (mevcut) {
                    mevcut.adet++;
                } else {
                    liste.unshift({
                        barkod: urun.Barcode,
                        adi: urun.InventoryName,
                        adet: 1
                    });
                }

                sonuc.innerHTML = `<p><strong>${urun.InventoryName}</strong> (${urun.Barcode})</p>`;
                renderListe();
            } else {
                sonuc.innerHTML = '<p style="color: red;">Ürün bulunamadı</p>';
            }

            input.value = '';
            input.focus();
        } catch (err) {
            sonuc.innerHTML = '<p style="color: red;">Hata: ' + err.message + '</p>';
            input.focus();
        }
    }

    function renderListe() {
        const toplamSatir = liste.length;
        const toplamAdet = liste.reduce((sum, item) => sum + item.adet, 0);

        document.getElementById('toplamSatir').textContent = `${toplamSatir} satır`;
        document.getElementById('toplamAdet').textContent = `${toplamAdet} adet`;

        if (liste.length === 0) {
            listeDiv.innerHTML = '<p style="color: #999;">Henüz okutulmadı</p>';
            return;
        }

        listeDiv.innerHTML = liste.map((item, index) => `
            <div class="liste-item">
                <div class="item-bilgi">
                    <span class="barkod">${item.barkod}</span>
                    <span class="adi">${item.adi}</span>
                </div>
                <div class="adet" data-index="${index}">${item.adet}</div>
            </div>
        `).join('');

        document.querySelectorAll('.liste-item').forEach(el => {
            el.addEventListener('click', function() {
                const idx = parseInt(this.querySelector('.adet').getAttribute('data-index'));
                acModal(idx);
            });
        });
    }

    let seciliIndex = 0;

    function acModal(index) {
        seciliIndex = index;
        const modal = document.getElementById('adetModal');
        const input = document.getElementById('adetInput');
        input.value = liste[index].adet;
        modal.classList.remove('hidden');
        input.focus();
        input.select();

        document.getElementById('adetKaydet').onclick = () => {
            const yeniAdet = parseInt(input.value) || 1;
            liste[seciliIndex].adet = yeniAdet;
            renderListe();
            modal.classList.add('hidden');
            document.getElementById('barkodInput').focus();
        };

        document.getElementById('adetIptal').onclick = () => {
            modal.classList.add('hidden');
        };
    }

    document.getElementById('exportBtn')?.addEventListener('click', exportCSV);
    document.getElementById('silBtn')?.addEventListener('click', () => {
        if (confirm('Listeyi temizlemek istediğinize emin misiniz?')) {
            liste = [];
            renderListe();
        }
    });

    function exportCSV() {
        if (liste.length === 0) {
            alert('Liste boş!');
            return;
        }

        const dosyaAdiInput = document.getElementById('dosyaAdi');
        const dosyaAdi = dosyaAdiInput.value.trim().toUpperCase() || 'barkod';

        fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ liste, dosyaAdi })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Kaydedildi: ' + data.file.replace('.xlsx', ''));
                liste = [];
                renderListe();
                dosyaAdiInput.value = '';
            } else {
                alert('Hata: ' + data.error);
            }
        })
        .catch(err => alert('Hata: ' + err.message));
    }

    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            
            menuBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (page === 'okuma') {
                document.querySelector('.scan-area').classList.remove('hidden');
                document.querySelector('.result-area').classList.remove('hidden');
                document.querySelector('.liste-area').classList.remove('hidden');
                document.querySelector('.export-area')?.classList.add('hidden');
            } else if (page === 'export') {
                document.querySelector('.scan-area').classList.add('hidden');
                document.querySelector('.result-area').classList.add('hidden');
                document.querySelector('.liste-area').classList.add('hidden');
                document.querySelector('.export-area')?.classList.remove('hidden');
            }
            
            input.focus();
        });
    });
});