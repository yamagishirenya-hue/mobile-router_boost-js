(function() {
    "use strict";

    // 統一するメッセージ
    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * ポップアップの監視と文言・デザイン制御
     */
    const observePopup = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;

                    // メッセージエリアとポップアップ外枠を取得
                    const msgArea = node.querySelector('div[style*="height: 56px"]');
                    const popupBox = node.closest('div[style*="rgb(240, 240, 240)"]') || node.querySelector('div[style*="rgb(240, 240, 240)"]');

                    if (msgArea && popupBox) {
                        const originalText = msgArea.innerText;

                        // 1. 文言の内容によってクラスとメッセージを切り分ける
                        if (originalText.includes("誤り") || originalText.includes("必須") || originalText.includes("入力してください")) {
                            // エラー系の場合
                            msgArea.innerText = MSG_ERROR;
                            popupBox.classList.add('kb-popup-error');
                            popupBox.classList.remove('kb-popup-confirm');
                        } else {
                            // それ以外（確認系）の場合
                            msgArea.innerText = MSG_CONFIRM;
                            popupBox.classList.add('kb-popup-confirm');
                            popupBox.classList.remove('kb-popup-error');
                        }
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    /**
     * 郵便番号UI
     */
    const initPostalCodeUI = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField || parentField.querySelector('.postal-box-container')) return;
        const originalInput = parentField.querySelector('.kb-field-value input');
        if (!originalInput) return;

        originalInput.style.position = 'absolute';
        originalInput.style.opacity = '0';
        originalInput.style.height = '0';

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

    /**
     * 入力制限（数字のみ）
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
     * バリデーション
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        // 電話番号
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val && (val.length < 10 || val.length > 11)) {
                showError(id, "数字10桁または11桁で入力してください");
                hasError = true;
            }
        });

        // 郵便番号
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

    /**
     * 表示切り替え
     */
    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- 実行 ---
    observePopup();
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
                kb.alert("エラー"); // observePopupでMSG_ERRORに書き換わります
                ev.error = true;
            } else {
                kb.alert("確認"); // observePopupでMSG_CONFIRMに書き換わります
            }
            return ev;
        });
    }

})();
