(function() {
    "use strict";

    // 確認用のメッセージ (\nで改行)
    const TARGET_MESSAGE = "入力内容に問題はありませんか？\nよろしければOKを押してください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // --- 1. アラートジャック ---
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOverridden) {
            const originalAlert = kb.alert;
            kb.alert = function(msg) {
                // 引数に関わらず確認メッセージを表示
                return originalAlert.apply(this, [TARGET_MESSAGE]);
            };
            kb.alert._isOverridden = true;
        }
    };

    // --- 2. 郵便番号UI ---
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField || parentField.querySelector('.postal-box-container')) return;
        const originalInput = parentField.querySelector('.kb-field-value input');
        if (!originalInput) return;

        originalInput.style.display = 'none';
        const container = document.createElement('div');
        container.className = 'postal-box-container';
        const boxes = [];

        for (let i = 0; i < 7; i++) {
            const box = document.createElement('input');
            box.className = 'postal-box-unit';
            box.maxLength = 1;
            box.inputMode = 'numeric';
            box.value = originalInput.value[i] || "";
            box.addEventListener('input', () => {
                box.value = box.value.replace(/[^\d]/g, "");
                if (box.value && i < 6) boxes[i+1].focus();
                originalInput.value = boxes.map(b => b.value).join('');
                originalInput.dispatchEvent(new Event('input', { bubbles: true }));
                originalInput.dispatchEvent(new Event('change', { bubbles: true }));
            });
            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && i > 0) boxes[i-1].focus();
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
        parentField.querySelector('.kb-field-value').appendChild(container);
    };

    // --- 3. エラー表示 ---
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
        const input = container.querySelector('input, select, textarea') || container.querySelector('.postal-box-unit');
        if (input) input.classList.add('error-input');
        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';
        errorWrap.innerHTML = `<div class="error-triangle"></div><span class="error-message">${message}</span>`;
        container.appendChild(errorWrap);
    };

    // --- 4. バリデーション実行 ---
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

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal.length !== 7) {
            showError("郵便番号", "7桁の数字を入力してください");
            hasError = true;
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

    // --- 監視・イベント登録 ---
    setInterval(() => {
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
            } else {
                // エラーがない場合でも、一度ポップアップを出す設定にする
                // ただし kb.confirm がない場合 kb.alert で代替
                kb.alert(TARGET_MESSAGE);
            }
            return ev;
        });
    }
})();
