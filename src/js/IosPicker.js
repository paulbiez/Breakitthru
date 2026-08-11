// src/js/IosPicker.js
export class IosPicker {
    constructor(totalLevels, onSelectCallback) {
        this.totalLevels = totalLevels;
        this.onSelect = onSelectCallback;
        this.overlay = document.getElementById('iosPickerOverlay');
        this.wheelList = document.getElementById('wheelList');
        this.container = document.getElementById('wheelContainer');
        this.btnCancel = document.querySelector('.ios-btn-cancel');
        this.btnSelect = document.querySelector('.ios-btn-select');
        
        this.setupListeners();
    }

    setupListeners() {
        if (this.btnCancel) {
            this.btnCancel.addEventListener('click', () => this.close());
        }
        if (this.btnSelect) {
            this.btnSelect.addEventListener('click', () => this.confirm());
        }
    }

    open(currentLevel) {
        if (!this.wheelList || !this.container || !this.overlay) return;
        
        this.wheelList.innerHTML = '';
        for (let i = 1; i <= this.totalLevels; i++) {
            let li = document.createElement('li');
            li.className = 'ios-wheel-item' + (i === currentLevel ? ' selected' : '');
            li.innerText = `Fase ${i}`;
            li.dataset.level = i;
            li.addEventListener('click', () => {
                this.container.scrollTo({ top: (i - 1) * 70, behavior: 'smooth' });
            });
            this.wheelList.appendChild(li);
        }
        
        this.overlay.style.display = 'flex';
        this.container.scrollTop = (currentLevel - 1) * 70;
        this.updateWheelVisuals();
        
        this.container.onscroll = () => this.updateWheelVisuals();
    }

    updateWheelVisuals() {
        const items = this.container.querySelectorAll('.ios-wheel-item');
        const containerCenter = this.container.scrollTop + this.container.clientHeight / 2;

        items.forEach(item => {
            const itemCenter = item.offsetTop + item.clientHeight / 2;
            const distance = Math.abs(containerCenter - itemCenter);
            
            if (distance < 35) {
                item.classList.add('selected');
                item.style.transform = 'scale(1.05)';
                item.style.opacity = '1';
            } else if (distance < 105) {
                item.classList.remove('selected');
                item.style.transform = 'scale(0.95)';
                item.style.opacity = '0.6';
            } else {
                item.classList.remove('selected');
                item.style.transform = 'scale(0.85)';
                item.style.opacity = '0.3';
            }
        });
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }

    confirm() {
        let index = Math.round(this.container.scrollTop / 70);
        let selectedLevel = Math.max(1, Math.min(this.totalLevels, index + 1));
        this.close();
        if (this.onSelect) this.onSelect(selectedLevel);
    }
}


