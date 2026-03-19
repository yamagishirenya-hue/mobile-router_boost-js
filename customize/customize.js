(function() {
    "use strict";

    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";

    /**
     * ポップアップの種類を判定して文言を書き換える
     */
    const rewritePopupContent = (node) => {
        // ポップアップの外枠（グレーの背景）を特定
        const popup = node.closest('div[style*="rgb(240, 240, 240)"]') || node.querySelector('div[style*="rgb(240, 240, 240)"]');
        if (!popup) return;

        // メッセージが書かれているエリアを特定
        const msgArea = popup.querySelector('div[style*="overflow"]');
        if (!msgArea) return;

        const originalText = msgArea.innerText.trim();

        // 1. 送信完了系 (Done! または既に書き換え済みのMSG_COMPLETE)
        if (originalText === "Done!" || originalText === MSG_COMPLETE) {
            msgArea.innerText = MSG_COMPLETE;
            msgArea.classList.add('custom-popup-complete');
        } 
        // 2. エラー系 (必須、誤り、入力などのキーワードを含む場合)
        else if (originalText.includes("必須") || originalText.includes("誤り") || originalText.includes("入力") || originalText.includes("確認")) {
            msgArea.innerText = MSG_ERROR;
            msgArea.classList.add('custom-popup-error');
        } 
        // 3. 確認系 (それ以外、または「送信」という言葉を含む場合)
        else if (originalText.length > 0 && originalText !== MSG_ERROR && originalText !== MSG_CONFIRM) {
            msgArea.innerText = MSG_CONFIRM;
            msgArea.classList.add('custom-popup-confirm');
        }
    };

    /**
     * 画面の監視（新しい要素が追加されたらチェック）
     */
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) rewritePopupContent(node);
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 既存のkb.alertも上書き（予備）
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

    // 郵便番号のリセットとアラート上書きを定期実行
    setInterval(() => {
        overrideKbAlert();
        const zipField = document.querySelector('[field-id="郵便番号"]');
        if (zipField) {
            const oldContainer = zipField.querySelector('.postal-box-container');
            if (oldContainer) oldContainer.remove();
            const input = zipField.querySelector('input');
            if (input) {
                input.style.display = 'block';
                input.style.position = 'static';
                input.style.opacity = '1';
                input.style.height = 'auto';
            }
        }
    }, 1000);

    // バリデーション等のイベント設定
    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            // ここにバリデーションロジックを入れる（以前のコードのvalidateAll相当）
            // 問題があれば ev.error = true;
            return ev;
        });
    }
})();
