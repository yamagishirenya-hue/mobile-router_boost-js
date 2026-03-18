(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // --- 郵便番号：1文字1枠UIの生成と同期（強化版） ---
    const initPostalCodeUI = () => {
        // 画像の構造に基づき、field-id="郵便番号" 内の入力エリアを取得
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;

        const valueContainer = parentField.querySelector('.kb-field-value');
        const originalInput = valueContainer ? valueContainer.querySelector('input') : null;

        // すでに作成済み、または入力欄がない場合は何もしない
        if (!originalInput || parentField.querySelector('.postal-box-container')) return;

        // 1. 元の入力を完全に隠す
        originalInput.style.display = 'none';

        // 2. 新しい入力枠のコンテナ作成
        const container = document.createElement('div');
        container.className = 'postal-box-container';

        const boxes = [];
        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.type = 'text';
            box.maxLength = 1;
            box.className = 'postal-box-unit';
            box.inputMode = 'numeric';
            
            box.addEventListener('input', (e) => {
                box.value = box.value.replace(/[^\d]/g, "");
                if (box.value && i < 6) boxes[i + 1].focus();
                syncValue();
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) {
                    boxes[i - 1].focus();
                }
            });

            container.appendChild(box);
            boxes.push(box);

            if (i === 2) {
                const hyphen = document.createElement('span');
                hyphen.className = 'postal-box-hyphen';
                hyphen.innerText = '-';
                container.appendChild(hyphen);
            }
        }

        const syncValue = () => {
            originalInput.value = boxes.map(b => b.value).join('');
            originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        };

        // 元の入力欄の直後に挿入
        valueContainer.appendChild(container);
    };

    const handleInputControl = (e) => {
        const fieldId = e.target.closest('[field-id]')?.getAttribute('field-id');
        if (!fieldId) return;
        let val = e.target.value;
        if (fieldId.includes("電話番号")) {
            val = val.replace(/[^\d]/g, ""); 
            if (val.length > 11) val = val.slice(0, 11);
            e.target.value = val;
        }
        if (fieldId === "郵便番号") {
            val = val.replace(/[^\d]/g, ""); 
            if (val.length > 7) val = val.slice(0, 7);
            e.target.value = val;
        }
    };

    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        removeError(fieldId);
        if (fieldId === "郵便番号") {
            container.querySelectorAll('.postal-box-unit').forEach(el => el.classList.add('error-input'));
        } else {
            const input = container.querySelector('input, select, textarea');
            if (input) input.classList.add('error-input');
        }
        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';
        const triangle = document.createElement('div');
        triangle.className = 'error-triangle';
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.innerText = message;
        errorWrap.appendChild(triangle);
        errorWrap.appendChild(errorSpan);
        container.appendChild(errorWrap);
    };

    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        container.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        const existing = container.querySelector('.custom-error-container');
        if (existing) existing.remove();
    };

    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val.length < 10 || val.length > 11) { showError(id, "数字10桁または11桁で入力してください"); hasError = true; }
        });
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!(record["連絡先メールアドレス"]?.value || "").match(mailRegex)) { showError("連絡先メールアドレス", "形式を確認してください"); hasError = true; }
        if (isDiff && !(record["返送先対象者のメールアドレス"]?.value || "").match(mailRegex)) { showError("返送先対象者のメールアドレス", "形式を確認してください"); hasError = true; }
        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal.length !== 7) { showError("郵便番号", "7桁の数字を入力してください"); hasError = true; }
        if (isDiff) {
            targetFieldIds.forEach(id => { if (!(record[id]?.value || "").trim()) { showError(id, "必須項目です"); hasError = true; } });
        }
        if (hasError) alert("入力内容に誤りがあります。");
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // 監視タイマー：要素が出るまで繰り返し実行
    const timer = setInterval(() => {
        if (document.querySelector('[field-id="郵便番号"]')) {
            initPostalCodeUI();
            if (typeof kb !== 'undefined' && kb.event) {
                // clearInterval(timer); // フォームが動的に変わる場合は止めずに監視
                document.addEventListener('input', handleInputControl);
                kb.event.on('kb.view.show', (ev) => { updateVisibility(ev.record); initPostalCodeUI(); return ev; });
                kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
                kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
            }
        }
    }, 300);
})();
