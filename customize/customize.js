(function() {
    "use strict";

    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. ポップアップの監視（安全策を追加）
     */
    const observePopup = () => {
        const targetNode = document.body;
        
        // 【修正】bodyが見つからない場合は、DOMContentLoadedイベントを待ってから再実行
        if (!targetNode) {
            window.addEventListener('DOMContentLoaded', observePopup);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    
                    const msgArea = node.querySelector('div[style*="height:"]') || node.querySelector('div[style*="overflow: hidden auto"]');
                    const popupBox = node.closest('div[style*="rgb(240, 240, 240)"]') || node.querySelector('div[style*="rgb(240, 240, 240)"]');
                    
                    if (msgArea && popupBox) {
                        msgArea.style.height = 'auto';
                        msgArea.style.minHeight = '60px';
                        msgArea.style.overflow = 'visible';
                        if (popupBox) popupBox.style.height = 'auto';

                        const txt = msgArea.innerText;
                        if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力")) {
                            msgArea.innerText = MSG_ERROR;
                        } else {
                            msgArea.innerText = MSG_CONFIRM;
                        }
                    }
                });
            });
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    };

    /**
     * 2. 郵便番号欄のリセット（過去の残像対策）
     */
    const resetPostalInput = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;

        const oldContainer = parentField.querySelector('.postal-box-container');
        if (oldContainer) oldContainer.remove();

        const originalInput = parentField.querySelector('input');
        if (originalInput && (originalInput.style.display === 'none' || originalInput.style.position === 'absolute')) {
            originalInput.style.display = 'block';
            originalInput.style.position = 'static';
            originalInput.style.opacity = '1';
            originalInput.style.height = 'auto';
            originalInput.style.pointerEvents = 'auto';
        }
    };

    /**
     * 3. 入力制御（郵便番号のハイフン & 電話番号数字制限）
     */
    const handleInputControl = (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');

        let val = e.target.value;

        if (fieldId === "郵便番号") {
            let digits = val.replace(/[^\d]/g, "");
            if (digits.length <= 3) {
                val = digits;
            } else {
                val = digits.slice(0, 3) + "-" + digits.slice(3, 7);
            }
            e.target.value = val;
        } 
        else if (fieldId && fieldId.includes("電話番号")) {
            e.target.value = val.replace(/[^\d]/g, "").slice(0, 11);
        }
    };

    /**
     * 4. エラー表示制御
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
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');
        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';
        errorWrap.innerHTML = `<div class="error-triangle"></div><div class="error-message">${message}</div>`;
        container.appendChild(errorWrap);
    };

    /**
     * 5. バリデーション実行
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) {
            showError("郵便番号", "7桁の数字を入力してください");
            hasError = true;
        }

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
    observePopup(); // 安全策付きで実行
    document.addEventListener('input', handleInputControl);
    
    setInterval(resetPostalInput, 1000);

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
