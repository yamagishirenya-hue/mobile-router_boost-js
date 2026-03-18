(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // --- 【新規】Boost!風ポップアップを表示する関数 ---
    const showCustomDialog = (message) => {
        // すでにダイアログがあれば削除
        const existing = document.querySelector('.custom-kb-dialog-overlay');
        if (existing) existing.remove();

        // オーバーレイの作成
        const overlay = document.createElement('div');
        overlay.className = 'custom-kb-dialog-overlay';
        overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000000; display: flex; align-items: center; justify-content: center;";

        // ダイアログ本体（CSSで定義したスタイルが適用される構造）
        const dialog = document.createElement('div');
        dialog.style = "background-color: rgb(240, 240, 240); width: 90%; max-width: 400px; position: relative;"; // CSSの div[style*="rgb(240, 240, 240)"] に合致

        // メッセージエリア
        const content = document.createElement('div');
        content.style = "height: 56px;"; // CSSの div[style*="height: 56px"] に合致
        content.innerText = message;

        // ボタンエリア
        const footer = document.createElement('div');
        footer.style = "border-top: 1px solid rgb(66, 165, 245);"; // CSSの div[style*="border-top: ..."] に合致

        const btn = document.createElement('button');
        btn.className = 'kb-dialog-button';
        btn.innerText = 'OK';
        btn.onclick = () => overlay.remove();

        const btn = document.createElement('button');
        btn.className = 'kb-dialog-button';
        btn.innerText = 'OK';
        btn.style.border = 'none'; // JS側でも明示的にボーダーを消す
        btn.onclick = () => overlay.remove();

        footer.appendChild(btn);
        dialog.appendChild(content);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    };

    // --- 郵便番号：1文字1枠UIの生成と同期 ---
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;
        const valueContainer = parentField.querySelector('.kb-field-value');
        const originalInput = valueContainer ? valueContainer.querySelector('input') : null;
        if (!originalInput || parentField.querySelector('.postal-box-container')) return;

        originalInput.style.display = 'none';
        const container = document.createElement('div');
        container.className = 'postal-box-container';

        const boxes = [];
        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.type = 'text'; box.maxLength = 1; box.className = 'postal-box-unit'; box.inputMode = 'numeric';
            box.addEventListener('input', () => {
                box.value = box.value.replace(/[^\d]/g, "");
                if (box.value && i < 6) boxes[i + 1].focus();
                syncValue();
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
        const syncValue = () => {
            originalInput.value = boxes.map(b => b.value).join('');
            originalInput.dispatchEvent(new Event('input', { bubbles: true }));
            originalInput.dispatchEvent(new Event('change', { bubbles: true }));
        };
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
        errorWrap.innerHTML = '<div class="error-triangle"></div><span class="error-message"></span>';
        errorWrap.querySelector('.error-message').innerText = message;
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
            if (val && (val.length < 10 || val.length > 11)) { showError(id, "数字10桁または11桁で入力してください"); hasError = true; }
        });

        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if ((record["連絡先メールアドレス"]?.value || "") && !(record["連絡先メールアドレス"]?.value).match(mailRegex)) { showError("連絡先メールアドレス", "形式を確認してください"); hasError = true; }
        if (isDiff && (record["返送先対象者のメールアドレス"]?.value || "") && !(record["返送先対象者のメールアドレス"]?.value).match(mailRegex)) { showError("返送先対象者のメールアドレス", "形式を確認してください"); hasError = true; }

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) { showError("郵便番号", "7桁の数字を入力してください"); hasError = true; }
        
        if (isDiff) {
            targetFieldIds.forEach(id => { if (!(record[id]?.value || "").trim()) { showError(id, "必須項目です"); hasError = true; } });
        }

        if (hasError) {
            // alert の代わりに自作ポップアップを表示
            showCustomDialog("入力内容に誤りがあります。");
        }
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    const timer = setInterval(() => {
        if (document.querySelector('[field-id="郵便番号"]')) {
            initPostalCodeUI();
            if (typeof kb !== 'undefined' && kb.event) {
                document.addEventListener('input', handleInputControl);
                kb.event.on('kb.view.show', (ev) => { updateVisibility(ev.record); initPostalCodeUI(); return ev; });
                kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
                kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
            }
        }
    }, 300);
})();
