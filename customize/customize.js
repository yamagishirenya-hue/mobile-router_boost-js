(function() {
    "use strict";

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
        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.type = 'text';
            box.maxLength = 1;
            box.className = 'postal-box-unit';
            box.inputMode = 'numeric';
            
            // 入力時の挙動
            box.addEventListener('input', (e) => {
                box.value = box.value.replace(/[^\d]/g, "");
                if (box.value && i < 6) boxes[i + 1].focus();
                syncValue();
            });

            // 削除時の挙動（前へ戻る）
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) {
                    boxes[i - 1].focus();
                }
            });

            container.appendChild(box);
            boxes.push(box);

            // ハイフンの挿入
            if (i === 2) {
                const hyphen = document.createElement('span');
                hyphen.className = 'postal-box-hyphen';
                hyphen.innerText = '-';
                container.appendChild(hyphen);
            }
        }

        const syncValue = () => {
            originalInput.value = boxes.map(b => b.value).join('');
            // kintone/フォーム側の変更検知を発火
            originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        };

        valueContainer.appendChild(container);

        // 初期値がある場合の反映
        if (originalInput.value) {
            const vals = originalInput.value.replace(/[^\d]/g, "").split("");
            vals.forEach((v, idx) => { if (boxes[idx]) boxes[idx].value = v; });
        }
    };

    // 共通入力制御（数値のみ・桁数制限）
    const handleInputControl = (e) => {
        const fieldId = e.target.closest('[field-id]')?.getAttribute('field-id');
        if (!fieldId) return;
        
        if (fieldId.includes("電話番号") || fieldId === "郵便番号") {
            let val = e.target.value.replace(/[^\d]/g, "");
            const max = fieldId === "郵便番号" ? 7 : 11;
            if (val.length > max) val = val.slice(0, max);
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

    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        // 全エラーリセット
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        // 電話番号バリデーション
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val.length < 10 || val.length > 11) {
                showError(id, "10桁または11桁の数字で入力してください");
                hasError = true;
            }
        });

        // メールバリデーション
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        const checkMail = (id) => {
            if (!(record[id]?.value || "").match(mailRegex)) {
                showError(id, "メールアドレスの形式が正しくありません");
                hasError = true;
            }
        };
        checkMail("連絡先メールアドレス");
        if (isDiff) checkMail("返送先対象者のメールアドレス");

        // 郵便番号バリデーション
        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal.length !== 7) {
            showError("郵便番号", "7桁の数字を入力してください");
            hasError = true;
        }

        // 必須項目（返送先が異なる場合）
        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "この項目は必須です");
                    hasError = true;
                }
            });
        }

        if (hasError) alert("入力内容に誤りがあります。確認してください。");
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- メイン処理 ---
    let initialized = false;
    const timer = setInterval(() => {
        const zipField = document.querySelector('[field-id="郵便番号"]');
        if (zipField && typeof kb !== 'undefined' && kb.event) {
            if (!initialized) {
                initPostalCodeUI();
                document.addEventListener('input', handleInputControl);
                
                kb.event.on('kb.view.show', (ev) => { updateVisibility(ev.record); initPostalCodeUI(); return ev; });
                kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
                kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) return false; return ev; });
                
                initialized = true;
                // 監視は継続（動的な要素生成に対応するため）
            } else {
                initPostalCodeUI(); // 追加要素への対応
            }
        }
    }, 500);
})();
