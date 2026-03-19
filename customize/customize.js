(function() {
    "use strict";

    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. ポップアップの直接チェック（ピンポイント監視版）
     */
    const checkPopup = () => {
        // Boosterのポップアップ外枠（グレー背景のdiv）を特定
        const popupBox = document.querySelector('div[style*="rgb(240, 240, 240)"]');
        if (!popupBox) return;

        // その中のメッセージエリア（height: 162pxなど）を特定
        const msgArea = popupBox.querySelector('div[style*="overflow: hidden auto"], div[style*="height:"]');
        if (!msgArea) return;

        // スタイル修正（見切れ防止）
        msgArea.style.setProperty('height', 'auto', 'important');
        msgArea.style.setProperty('min-height', '60px', 'important');
        msgArea.style.setProperty('overflow', 'visible', 'important');
        popupBox.style.setProperty('height', 'auto', 'important');

        const txt = msgArea.innerText ? msgArea.innerText.trim() : "";

        // --- A. 送信完了(Done!) の処理 ---
        if (txt === "Done!" || txt === MSG_COMPLETE) {
            if (msgArea.innerText !== MSG_COMPLETE) {
                msgArea.innerText = MSG_COMPLETE;
                msgArea.style.fontSize = '22px';
            }

            // OKボタンに遷移を仕込む
            const okBtn = popupBox.querySelector('.kb-dialog-button');
            if (okBtn && !okBtn._hasListener) {
                okBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 現在のページ（入力画面）をリロードして戻る
                    window.location.reload();
                }, { once: true });
                okBtn._hasListener = true;
            }
        } 
        // --- B. エラー・確認メッセージの処理 ---
        else if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力") || txt.includes("確認")) {
            if (msgArea.innerText !== MSG_ERROR && txt.length > 20) {
                msgArea.innerText = MSG_ERROR;
            }
        } else if (txt !== MSG_COMPLETE && txt !== MSG_CONFIRM && txt.length > 5) {
            if (msgArea.innerText !== MSG_CONFIRM) msgArea.innerText = MSG_CONFIRM;
        }
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
     * 5. バリデーション
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        
        // エラー解除用
        const removeError = (id) => {
            const container = document.querySelector(`[field-id="${id}"]`);
            if (!container) return;
            container.querySelectorAll('.error-input').forEach(el => el.classList.remove('error-input'));
            const existing = container.querySelector('.custom-error-container');
            if (existing) existing.remove();
        };
        // エラー表示用
        const showError = (id, message) => {
            const container = document.querySelector(`[field-id="${id}"]`);
            if (!container) return;
            removeError(id);
            const input = container.querySelector('input, select, textarea');
            if (input) input.classList.add('error-input');
            const errorWrap = document.createElement('div');
            errorWrap.className = 'custom-error-container';
            errorWrap.innerHTML = `<div class="error-triangle"></div><div class="error-message">${message}</div>`;
            container.appendChild(errorWrap);
        };

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
    
    // 定期チェック
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
