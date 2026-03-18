(function() {
    "use strict";

    const TARGET_MESSAGE = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const CONFIRM_MESSAGE = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * ポップアップのインラインスタイルを強制掃除し、文言を差し替える
     */
    const cleanPopupStyle = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((node) => {
                node.addedNodes.forEach((added) => {
                    if (added.nodeType !== 1) return;

                    // 1. メッセージエリア（高さが固定されているdiv）を探す
                    const msgArea = added.querySelector('div[style*="overflow: hidden auto"]') || added.querySelector('div[style*="height:"]');
                    // 2. ボタンエリア（下にへばりついているdiv）を探す
                    const btnArea = added.querySelector('div[style*="position: absolute"][style*="bottom: 0px"]');
                    // 3. ポップアップ全体の枠
                    const popupBox = added.closest('div[style*="rgb(240, 240, 240)"]') || added.querySelector('div[style*="rgb(240, 240, 240)"]');

                    if (msgArea && popupBox) {
                        // 【ここがポイント】タグに直接書かれた height や position などの設定を空にする
                        msgArea.style.height = 'auto';
                        msgArea.style.minHeight = '100px';
                        msgArea.style.maxHeight = 'none';
                        msgArea.style.overflow = 'visible';

                        if (btnArea) {
                            btnArea.style.position = 'relative';
                            btnArea.style.bottom = 'auto';
                        }

                        popupBox.style.height = 'auto';

                        // 文言判定と差し替え
                        const txt = msgArea.innerText;
                        if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力")) {
                            msgArea.innerText = TARGET_MESSAGE;
                        } else if (txt.includes("OK") || txt.includes("送信") || txt.includes("保存")) {
                            msgArea.innerText = CONFIRM_MESSAGE;
                        }
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    /**
     * 郵便番号UI: 1文字1枠
     */
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField || parentField.querySelector('.postal-box-container')) return;
        const valueContainer = parentField.querySelector('.kb-field-value');
        const originalInput = valueContainer ? valueContainer.querySelector('input') : null;
        if (!originalInput) return;

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

    /**
     * 数字のみに制限
     */
    const handleInputControl = (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');
        if (fieldId && (fieldId.includes("電話番号") || fieldId === "郵便番号")) {
            let val = e.target.value.replace(/[^\d]/g, "");
            const max = fieldId === "郵便番号" ? 7 : 11;
            if (val.length > max) val = val.slice(0, max);
            e.target.value = val;
        }
    };

    /**
     * エラー表示・非表示
     */
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
        errorWrap.innerHTML = `<div class="error-triangle"></div><div class="error-message">${message}</div>`;
        container.appendChild(errorWrap);
    };

    /**
     * 全項目バリデーション
     */
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
        ["連絡先メールアドレス", isDiff ? "返送先対象者のメールアドレス" : null].filter(v => v).forEach(id => {
            if (record[id]?.value && !record[id].value.match(mailRegex)) {
                showError(id, "形式を確認してください");
                hasError = true;
            }
        });

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) {
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
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- 実行開始 ---
    cleanPopupStyle(); // ポップアップの汚れ落としを起動
    document.addEventListener('input', handleInputControl);
    setInterval(initPostalCodeUI, 500);

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
