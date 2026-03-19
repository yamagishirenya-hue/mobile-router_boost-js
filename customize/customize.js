(function() {
    "use strict";

    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. ポップアップの監視（エラー回避策を強化）
     */
    const observePopup = () => {
        const targetNode = document.body;
        
        // 【修正】bodyがない場合は、準備ができるまで待ってから再実行する
        if (!targetNode) {
            const retry = setInterval(() => {
                if (document.body) {
                    clearInterval(retry);
                    observePopup();
                }
            }, 100);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    
                    // --- 通常のアラートエリアを探す ---
                    const msgArea = node.querySelector('div[style*="height:"]') || node.querySelector('div[style*="overflow: hidden auto"]');
                    const popupBox = node.closest('div[style*="rgb(240, 240, 240)"]') || node.querySelector('div[style*="rgb(240, 240, 240)"]');
                    
                    if (msgArea && popupBox) {
                        msgArea.style.height = 'auto';
                        msgArea.style.minHeight = '60px';
                        msgArea.style.overflow = 'visible';
                        popupBox.style.height = 'auto';

                        // 文言書き換え
                        const txt = msgArea.innerText;
                        if (txt === MSG_ERROR || txt === MSG_CONFIRM) return;
                        if (txt.includes("誤り") || txt.includes("必須") || txt.includes("入力") || txt.includes("確認")) {
                            msgArea.innerText = MSG_ERROR;
                        } else if (txt !== "Done!") {
                            msgArea.innerText = MSG_CONFIRM;
                        }
                    }

                    // --- 【修正】送信完了(Done!)ポップアップの強制スタイル解除 ---
                    // 画像のHTML「height: 162px」と「overflow: hidden auto」を狙い撃ちします
                    const doneMsg = node.querySelector('div[style*="height: 162px"][style*="overflow: hidden auto"]');
                    if (doneMsg) {
                        doneMsg.style.height = 'auto';
                        doneMsg.style.minHeight = '100px';
                        doneMsg.style.overflow = 'visible';
                        doneMsg.style.display = 'flex';
                        doneMsg.style.alignItems = 'center';
                        doneMsg.style.justifyContent = 'center';
                        doneMsg.style.fontSize = '24px'; // Done! を大きく
                        
                        // 親の枠も高さを自由にする
                        const parent = doneMsg.closest('div[style*="rgb(240, 240, 240)"]');
                        if (parent) parent.style.height = 'auto';
                    }
                });
            });
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    };

    /**
     * 2. アラート関数のジャック（文言統一）
     */
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOver
