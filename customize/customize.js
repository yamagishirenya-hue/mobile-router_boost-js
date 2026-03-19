(function() {
    "use strict";

    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. ポップアップの直接チェック（力技での文字検索方式）
     */
    const checkPopup = () => {
        // 画面内の全DIVから、Boosterのポップアップらしきものを探す
        const allDivs = document.querySelectorAll('div');
        
        allDivs.forEach(div => {
            const txt = div.innerText ? div.innerText.trim() : "";
            
            // --- A. 送信完了(Done!) の検知 ---
            if (txt === "Done!" || txt === MSG_COMPLETE) {
                // 文言書き換え
                if (div.innerText !== MSG_COMPLETE) {
                    div.innerText = MSG_COMPLETE;
                    div.style.setProperty('font-size', '22px', 'important');
                    div.style.setProperty('height', 'auto', 'important');
                    div.style.setProperty('overflow', 'visible', 'important');
                }

                // 親の白い枠を探してサイズ調整
                const parentBox = div.closest('div[style*="rgb(240, 240, 240)"]');
                if (parentBox) {
                    parentBox.style.setProperty('height', 'auto', 'important');
                    parentBox.style.setProperty('min-height', '200px', 'important');
                    
                    // OKボタンに遷移を仕込む
                    const okBtn = parentBox.querySelector('.kb-dialog-button');
                    if (okBtn && !okBtn._hasListener) {
                        okBtn.style.setProperty('cursor', 'pointer', 'important');
                        okBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            // 入力画面へ自遷移（現在のURLにリロード）
                            window.location.href = window.location.origin + window.location.pathname + window.location.search;
                        });
                        okBtn._hasListener = true;
                    }
                }
            } 
            
            // --- B. エラー・確認メッセージの検知 ---
            else if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力") || txt.includes("確認")) {
                // 長すぎるシステムメッセージを自作に差し替え
                if (txt.length > 50 && txt !== MSG_ERROR && txt !== MSG_CONFIRM) {
                    div.innerText = txt.includes("送信") ? MSG_CONFIRM : MSG_ERROR;
                    div.style.setProperty('height', 'auto', 'important');
                }
            }
        });
    };

    /**
     * 2. アラート関数のジャック
     */
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOverridden) {
            const originalAlert = kb.alert;
            kb.alert = function(msg) {
                let customMsg = MSG_CONFIRM;
                if (msg && (msg.includes("誤り") || msg.includes("必須") || msg.includes("入力"))) {
                    customMsg = MSG_ERROR;
                } else if (msg === "Done!") {
                    customMsg = MSG_COMPLETE;
                }
                return originalAlert.apply(this, [customMsg]);
            };
            kb.alert._isOverridden = true;
        }
    };

    /**
     * 3. 郵便番号のリセット
     */
    const resetPostalInput = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;
        const oldContainer = parentField.querySelector('.postal-box-container');
        if (oldContainer) oldContainer.remove();
        const originalInput = parentField.querySelector('input');
        if (originalInput) {
            originalInput.style.display = 'block';
            originalInput.style.position = 'static';
            originalInput.style.opacity = '1';
            originalInput.style.height = 'auto';
            originalInput.style.pointerEvents = 'auto';
        }
    };

    /**
     * 4. 入力制御
     */
    const handleInputControl = (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');
        let val = e.target.value;
        if (fieldId === "郵便番号") {
            let digits = val.replace(/[^\d]/g, "");
            e.target.value = digits.length <= 3 ? digits : digits.slice(0, 3) + "-" + digits.slice(3, 7);
        } else if (fieldId && fieldId.includes("電話番号")) {
            e.target.value = val.replace(/[^\d]/g, "").slice(0, 11);
        }
    };

    /**
     * 5. エラー表示
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
     * 6. バリデーション
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

        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) {
                    showError(id, "必須項目です");
                    hasError = true;
                }
            });
        }
        if (hasError) kb.alert(MSG_ERROR);
        return !hasError;
    };

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
    };

    // --- 実行 ---
    document.addEventListener('input', handleInputControl);
    
    // 0.5秒おきに状態をチェック
    setInterval(() => { 
        checkPopup();
        overrideKbAlert();
        resetPostalInput();
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
