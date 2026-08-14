// src/js/IosPicker.js

export class IosPicker {
    constructor(totalLevels, onSelectCallback) {
        this.totalLevels = totalLevels;
        this.onSelectCallback = onSelectCallback;
        this.selectedIndex = 0;
        this.itemHeight = 40; // Altura de cada item no tambor
        this.scrollOffset = 0;
        this.startY = 0;
        this.startOffset = 0;
        this.isDragging = false;

        this.overlay = document.getElementById('iosPickerOverlay');
        this.init();
    }

    init() {
        if (!this.overlay) return;

        // Renderiza a estrutura do Tambor 3D no estilo iOS
        this.overlay.innerHTML = `
            <div class="ios-picker-card">
                <div class="ios-picker-header">
                    <span class="ios-picker-title">Selecionar Fase</span>
                </div>
                <div class="ios-picker-body">
                    <div class="ios-picker-wheel-wrap">
                        <div class="ios-picker-selection-bar"></div>
                        <div class="ios-picker-wheel" id="iosPickerWheel"></div>
                    </div>
                </div>
                <div class="ios-picker-footer">
                    <button class="ios-picker-btn cancel" id="iosPickerCancel">Cancelar</button>
                    <button class="ios-picker-btn confirm" id="iosPickerConfirm">OK</button>
                </div>
            </div>
        `;

        this.wheel = document.getElementById('iosPickerWheel');
        this.cancelBtn = document.getElementById('iosPickerCancel');
        this.confirmBtn = document.getElementById('iosPickerConfirm');

        // Cria os itens do tambor
        this.wheel.innerHTML = '';
        for (let i = 1; i <= this.totalLevels; i++) {
            const item = document.createElement('div');
            item.className = 'ios-picker-item';
            item.innerText = `Fase ${i}`;
            this.wheel.appendChild(item);
        }

        this.items = this.wheel.querySelectorAll('.ios-picker-item');

        // Eventos de Toque e Arrasto no Rolo
        const wheelWrap = this.overlay.querySelector('.ios-picker-wheel-wrap');
        
        const onStart = (e) => {
            this.isDragging = true;
            this.startY = e.touches ? e.touches[0].clientY : e.clientY;
            this.startOffset = this.scrollOffset;
            this.wheel.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!this.isDragging) return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaY = clientY - this.startY;
            this.scrollOffset = this.startOffset + deltaY;
            this.updateWheelTransform();
        };

        const onEnd = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.snapToNearest();
        };

        wheelWrap.addEventListener('touchstart', onStart, { passive: true });
        wheelWrap.addEventListener('touchmove', onMove, { passive: true });
        wheelWrap.addEventListener('touchend', onEnd);

        wheelWrap.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        this.cancelBtn.addEventListener('click', () => this.close());
        this.confirmBtn.addEventListener('click', () => {
            const selectedLevel = this.selectedIndex + 1;
            if (this.onSelectCallback) {
                this.onSelectCallback(selectedLevel);
            }
            this.close();
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    updateWheelTransform() {
        const minOffset = -(this.totalLevels - 1) * this.itemHeight;
        
        this.items.forEach((item, index) => {
            const itemY = index * this.itemHeight + this.scrollOffset;
            const angle = (itemY / this.itemHeight) * -18; // Ângulo de curvatura 3D
            const distance = Math.abs(itemY);

            if (distance < this.itemHeight * 3.5) {
                item.style.display = 'block';
                item.style.transform = `translateY(${this.scrollOffset}px) rotateX(${angle}deg) scale(${Math.max(0.75, 1 - distance / (this.itemHeight * 5))})`;
                item.style.opacity = Math.max(0.15, 1 - distance / (this.itemHeight * 2.2));
                
                if (distance < this.itemHeight / 2) {
                    item.classList.add('selected');
                    this.selectedIndex = index;
                } else {
                    item.classList.remove('selected');
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

    snapToNearest() {
        const minOffset = -(this.totalLevels - 1) * this.itemHeight;
        let clamped = Math.max(minOffset, Math.min(0, this.scrollOffset));
        
        this.selectedIndex = Math.round(-clamped / this.itemHeight);
        this.scrollOffset = -this.selectedIndex * this.itemHeight;

        this.wheel.style.transition = 'all 0.2s cubic-bezier(0.1, 0.85, 0.25, 1)';
        this.updateWheelTransform();
    }

    open(currentLevel = 1) {
        this.selectedIndex = Math.max(0, Math.min(this.totalLevels - 1, currentLevel - 1));
        this.scrollOffset = -this.selectedIndex * this.itemHeight;
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            this.updateWheelTransform();
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
}
