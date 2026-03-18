(function() {
    "use strict";

    // 設定：対象フィールド
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // --- 郵便番号：1文字1枠UIの生成 ---
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField || parentField.querySelector('.postal-box-container')) return;

        const valueContainer = parentField.querySelector('.kb-field-value');
        const originalInput = valueContainer ? valueContainer.querySelector('input') : null;
        if (!originalInput) return;

        originalInput.style.display = 'none';
        const container = document.createElement('div');
        container.className = 'postal-box-container';

        const boxes = [];
        const currentVal = originalInput.value.replace(/[^\d]/g, "").split("");

        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.type = 'text';
            box.maxLength = 1;
            box.className = 'postal-box-unit';
            box.inputMode = 'numeric';
            box.value = currentVal[i] || ""; // 初期値セット
            
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
            const newVal = boxes.map(b => b.value).join('');
            // Boost!の内部値と同期
            kb.field('郵便番号').value = newVal;
            originalInput.value = newVal;
        };

        valueContainer.appendChild(container);
    };

    // --- エラー表示制御 ---
    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        removeError(fieldId);
        
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');
        if (fieldId === "郵便番号") {
            container.querySelectorAll('.postal-box-unit').forEach(el => el.classList.add('error-input'));
        }

        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';
        errorWrap.innerHTML = `<div class="error-triangle"></div><span class="error-message">${message}</span>`;
        container.appendChild(errorWrap);
    };

    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        container.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
        const existing = container.querySelector('.custom-error-container');
        if (existing) existing.remove();
    };

    // --- バリデーション実行 ---
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        
        // 全エラーを一旦クリア
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        // 電話番号バリデーション
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val.length < 10 || val.length > 11) {
                showError(id, "数字10桁または11桁で入力してください");
                hasError = true;
            }
        });

        // メールバリデーション
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        ["連絡先メールアドレス", isDiff ? "返送先対象者のメールアドレス" : null].forEach(id => {
            if (id && !(record[id]?.value || "").match(mailRegex)) {
                showError(id, "形式を確認してください");
                hasError = true;
            }
        });

        // 郵便番号バリデーション
        if ((record["郵便番号"]?.value || "").replace(/[^\d]/g, "").length !== 7) {
            showError("郵便番号", "7桁の数字を入力してください");
            hasError = true;
        }

        // 返送先が異なる場合の必須チェック
        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "必須項目です");
                    hasError = true;
                }
            });
        }

        if (hasError) alert("入力内容に誤りがあります。確認してください。");
        return !hasError;
    };

    // --- フィールド表示制御 ---
    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- Boost! イベント登録 ---
    // APIドキュメントに基づき、kb.event.on を使用
    if (typeof kb !== 'undefined' && kb.event) {
        
        // フォーム表示時
        kb.event.on('kb.view.show', (ev) => {
            updateVisibility(ev.record);
            // 描画を確実にするため少し遅延させてUI実行
            setTimeout(initPostalCodeUI, 100);
            return ev;
        });

        // 値変更時（返送先対象者確認）
        kb.event.on('kb.change.返送先対象者確認', (ev) => {
            updateVisibility(ev.record);
            return ev;
        });

        // 保存（送信）時バリデーション
        kb.event.on('kb.create.submit', (ev) => {
            if (!validateAll(ev.record)) {
                // Boost! の仕様：ev.error = true にすると送信を中断
                ev.error = "入力エラーがあります"; 
            }
            return ev;
        });
    }

})();
