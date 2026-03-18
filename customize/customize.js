(function() {
    "use strict";

    const TARGET_MESSAGE = "入力内容に誤りがあります。<br>赤枠の項目を確認してください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // --- 1. Boosterの標準アラート関数をジャックして文言を統一 ---
    // これにより kb.alert() が呼ばれた際、引数が何であれ TARGET_MESSAGE に差し替えられます
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOverridden) {
            const originalAlert = kb.alert;
            kb.alert = function(msg) {
                // 引数を TARGET_MESSAGE に強制変更して実行
                return originalAlert.apply(this, [TARGET_MESSAGE]);
            };
            kb.alert._isOverridden = true; // 二重適用防止
        }
    };

    // --- 2. 郵便番号: 1文字1枠UIの生成と同期 ---
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;

        const valueContainer = parentField.querySelector('.kb-field-value');
        const originalInput = valueContainer ? valueContainer.querySelector('input') : null;

        if (!originalInput || parentField.querySelector('.postal-box-container')) return;

        originalInput.style.position = 'absolute';
        originalInput.style.opacity = '0';
        originalInput.style.height = '0';
        originalInput.style.pointerEvents = 'none';

        const container = document.createElement('div');
        container.className = 'postal-box-container';
        const boxes = [];

        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.type = 'text';
            box.maxLength = 1;
            box.className = 'postal-box-unit';
            box.inputMode = 'numeric';
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
            originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        };

        valueContainer.appendChild(container);
    };

    // --- 3. 入力制限（電話番号・郵便番号） ---
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

    // --- 4. エラー表示制御 ---
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
            container.querySelectorAll('.postal-box-unit').forEach(el => el.classList.add('error-input'));
        } else {
            const input = container.querySelector('input, select, textarea');
            if (input) input.classList.add('error-input');
        }

        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';
        errorWrap.innerHTML = `<div class="error-triangle"></div><span class="error-message">${message}</span>`;
        container.appendChild(errorWrap);
    };

    // --- 5. バリデーション実行 ---
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val && (val.length < 10 || val.length > 11)) {
                showError(id, "数字10桁または11桁で入力してください");
                hasError = true;
            }
        });

        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (record["連絡先メールアドレス"]?.value && !record["連絡先メールアドレス"].value.match(mailRegex)) {
            showError("連絡先メールアドレス", "形式を確認してください");
            hasError = true;
        }
        if (isDiff && record["返送先対象者のメールアドレス"]?.value && !record["返送先対象者のメールアドレス"].value.match(mailRegex)) {
            showError("返送先対象者のメールアドレス", "形式を確認してください");
            hasError = true;
        }

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal.length !== 7) {
            showError("郵便番号", "7桁の数字を入力してください");
            hasError = true;
        }

        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "必須項目です");
                    hasError = true;
                }
            });
        }

        if (hasError) {
            kb.alert(TARGET_MESSAGE);
        }

        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- 実行と監視 ---
    document.addEventListener('input', handleInputControl);

    const timer = setInterval(() => {
        // 関数ジャックを実行（kbが定義されるまで繰り返す）
        overrideKbAlert();

        if (document.querySelector('[field-id="郵便番号"]')) {
            initPostalCodeUI();
        }
    }, 500);

    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.view.show', 'kb.create.show', 'kb.edit.show'], (ev) => {
            updateVisibility(ev.record);
            return ev;
        });

        kb.event.on('kb.change.返送先対象者確認', (ev) => {
            updateVisibility(ev.record);
            return ev;
        });

        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            if (!validateAll(ev.record)) {
                ev.error = true;
            }
            return ev;
        });
    }

})();
