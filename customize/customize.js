(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // 郵便番号UI生成
    const initPostalCodeUI = () => {
        const parent = document.querySelector('[field-id="郵便番号"]');
        if (!parent || parent.querySelector('.postal-box-container')) return;
        const valCont = parent.querySelector('.kb-field-value');
        const originalInput = valCont ? valCont.querySelector('input') : null;
        if (!originalInput) return;

        originalInput.style.display = 'none';
        const container = document.createElement('div');
        container.className = 'postal-box-container';
        const boxes = [];
        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.type = 'text'; box.maxLength = 1; box.className = 'postal-box-unit'; box.inputMode = 'numeric';
            box.value = originalInput.value[i] || ''; 
            box.addEventListener('input', () => {
                box.value = box.value.replace(/[^\d]/g, "");
                if (box.value && i < 6) boxes[i + 1].focus();
                originalInput.value = boxes.map(b => b.value).join('');
                originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus();
            });
            container.appendChild(box);
            boxes.push(box);
            if (i === 2) {
                const hyphen = document.createElement('span');
                hyphen.className = 'postal-box-hyphen'; hyphen.innerText = '-';
                container.appendChild(hyphen);
            }
        }
        valCont.appendChild(container);
    };

    const updateVisibility = (record) => {
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDiff);
    };

    // 監視タイマー
    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            initPostalCodeUI();
            
            // 入力制御
            document.addEventListener('input', (e) => {
                const fid = e.target.closest('[field-id]')?.getAttribute('field-id');
                if (fid && fid.includes("電話番号")) {
                    e.target.value = e.target.value.replace(/[^\d]/g, "").slice(0, 11);
                }
            });

            kb.event.on('kb.view.show', (ev) => { 
                updateVisibility(ev.record); 
                initPostalCodeUI();
                return ev; 
            });

            kb.event.on('kb.change.返送先対象者確認', (ev) => { 
                updateVisibility(ev.record); 
                return ev; 
            });

            // 保存前バリデーション（以前のロジックを統合）
            kb.event.on('kb.create.submit', (ev) => {
                // ここにvalidateAllの内容を記述（必要に応じて）
                return ev;
            });
        }
    }, 400);
})();
