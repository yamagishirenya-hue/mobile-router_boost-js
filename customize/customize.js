(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // --- 郵便番号: 1文字1枠UIの生成と同期 ---
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;

        const valueContainer = parentField.querySelector('.kb-field-value');
        const originalInput = valueContainer ? valueContainer.querySelector('input') : null;

        // すでに作成済み、または入力欄がない場合は何もしない
        if (!originalInput || parentField.querySelector('.postal-box-container')) return;

        // 1. 元の入力を隠す（Boosterのバリデーションに影響しないよう不可視化）
        originalInput.style.position = 'absolute';
        originalInput.style.opacity = '0';
        originalInput.style.height = '0';
        originalInput.style.pointerEvents = 'none';

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
            // 初期値を反映
            box.value = originalInput.value[i] || "";

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
            // Booster側のイベントを発火させる
            originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        };

        valueContainer.appendChild(container);
    };

    // --- 入力制限（電話番号・郵便番号） ---
    const handleInputControl = (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');

        let val = e.target.value;
        if (fieldId && (fieldId.includes("電話番号") || fieldId === "郵便番号")) {
            val = val.replace(/[^\d]/g, "");
            const max = fieldId === "郵便番号" ? 7 : 11;
            if (val.length > max) val = val.slice(0, max);
            e.target.value = val;
        }
    };

    // --- エラー表示制御 ---
    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        container.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        const existing = container.querySelector('.custom-error-container');
        if (existing) existing.remove();
    };

    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        removeError(fieldId);

        if (fieldId === "郵便番号") {
            container.querySelectorAll('.
