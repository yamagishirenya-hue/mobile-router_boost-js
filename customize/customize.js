(function() {
    "use strict";

    // メッセージ定義
    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * ポップアップの役割を判定して、文言とクラスを付与する
     */
    const updatePopupByContent = (element) => {
        // 対象が要素でない場合はスキップ
        if (!element || element.nodeType !== 1) return;

        // ポップアップの外枠（グレー背景のdiv）を特定
        // 渡された要素自体、またはその子要素、または親要素にポップアップがないか探す
        const popup = element.closest('div[style*="rgb(240, 240, 240)"]') || 
                      element.querySelector('div[style*="rgb(240, 240, 240)"]');
        
        if (!popup) return;

        // メッセージが書かれているエリアを特定
        const msgArea = popup.querySelector('div[style*="overflow"]');
        if (!msgArea) return;

        const txt = msgArea.innerText.trim();

        // 1. 送信完了系 (Done! または既に書き換え済みのMSG_COMPLETE)
        if (txt === "Done!" || txt === MSG_COMPLETE) {
            if (msgArea.innerText !== MSG_COMPLETE) {
                msgArea.innerText = MSG_COMPLETE;
                msgArea.classList.add('custom-msg-complete');
            }
        } 
        // 2. エラー系 (キーワード判定)
        else if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力") || txt.includes("確認")) {
            if (msgArea.innerText !== MSG_ERROR) {
                msgArea.innerText = MSG_ERROR;
                msgArea.classList.add('custom-msg-error');
            }
        } 
        // 3. 確認系 (それ以外、または「送信」という言葉を含む場合)
        else if (txt.length > 0 && txt !== MSG_CONFIRM) {
            msgArea.innerText = MSG_CONFIRM;
            msgArea.classList.add('custom-msg-confirm');
        }
    };

    /**
     * MutationObserverの開始（bodyが利用可能になるまで待機）
     */
    const initObserver = () => {
        if (!document.body) {
            setTimeout(initObserver, 100);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) updatePopupByContent(node);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // 【修正】初期表示時にも既に存在するポップアップを一度だけチェックする
        updatePopupByContent(document.body);
    };

    /**
     * 郵便番号のリセット（1文字1枠の残像を消す）
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
     * バリデーション
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        // エラー解除
        document.querySelectorAll('[field-id]').forEach(el => {
            const container = el;
            container.querySelectorAll('.error-input').forEach(e => e.classList.remove('error-input'));
            const existing = container.querySelector('.custom-error-container');
            if (existing) existing.remove();
        });

        // 郵便番号
        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) hasError = true;

        // 電話番号
        const telIds = ["連絡先電話番号", "モバイルルーターの電話番号"];
        if (isDiff) telIds.push("返送先対象者の電話番号");
        telIds.forEach(id => {
            const val = (record[id]?.value || "").replace(/[^\d]/g, "");
            if (val && (val.length < 10 || val.length > 11)) hasError = true;
        });

        if (isDiff) {
            targetFieldIds.forEach(id => {
                if (!(record[id]?.value || "").trim()) hasError = true;
            });
        }

        if (hasError && typeof kb !== 'undefined' && kb.alert) {
            kb.alert(MSG_ERROR);
        }
        return !hasError;
    };

    // --- 実行 ---
    initObserver();
    
    document.addEventListener('input', (e) => {
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
    });

    setInterval(resetPostalInput, 1000);

    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            if (!validateAll(ev.record)) {
                ev.error = true;
            }
            return ev;
        });
    }
})();
