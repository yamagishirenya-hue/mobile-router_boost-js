(function() {
    "use strict";

    // メッセージ定義
    const MSG_ERROR = "入力内容に誤りがあります。\n赤枠の項目を確認してください。";
    const MSG_CONFIRM = "入力内容に問題はありませんか？\nよろしければ送信してください。";
    const MSG_COMPLETE = "送信が完了しました。\n完了メールが送付されますので、ご確認ください。";
    
    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    /**
     * 1. キャリア案内文の表示制御
     * セレクトボックスの選択肢に合わせて、特定のIDを持つ案内を表示します
     */
    const updateCarrierGuidance = (selectedValue) => {
        const companyIds = ["company_kddi", "company_docomo", "company_softbank"];
        
        // 一旦すべてを隠す
        companyIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.setProperty('display', 'none', 'important');
        });

        // 選択されたキャリアのみを表示する
        let targetId = "";
        if (selectedValue === "au(KDDI)") targetId = "company_kddi";
        if (selectedValue === "docomo") targetId = "company_docomo";
        if (selectedValue === "Softbank") targetId = "company_softbank";
        if (selectedValue == "") targetId = "non_company";
        const targetEl = document.getElementById(targetId);
        if (targetId === non_company) {
            if (targetEl) targetEl.style.setProperty('display', 'none', 'important');
        } else if(targetId){
            if (targetEl) targetEl.style.setProperty('display', 'block', 'important');
        }
    };

    /**
     * 2. ポップアップの監視・書き換え
     */
    const updatePopupByContent = () => {
        const popup = document.querySelector('div[style*="rgb(240, 240, 240)"]');
        if (!popup) return;

        const msgArea = popup.querySelector('div[style*="overflow"]') || popup.querySelector('div[style*="height: 172px"]');
        if (!msgArea) return;

        const txt = msgArea.innerText.trim();

        // 送信完了(Done!)
        if (txt === "Done!" || txt === MSG_COMPLETE) {
            msgArea.innerText = MSG_COMPLETE;
            msgArea.style.setProperty('height', 'auto', 'important');
            msgArea.style.setProperty('min-height', '100px', 'important');
            msgArea.style.setProperty('display', 'flex', 'important');
            msgArea.style.setProperty('align-items', 'center', 'important');
            msgArea.style.setProperty('justify-content', 'center', 'important');
            msgArea.style.setProperty('font-size', '20px', 'important');

            const okBtn = popup.querySelector('.kb-dialog-button');
            if (okBtn && !okBtn.dataset.listenerAttached) {
                okBtn.addEventListener('click', () => window.location.reload());
                okBtn.dataset.listenerAttached = "true";
            }
        } 
        // エラー系
        else if (txt.includes("誤り") || txt.includes("必須")) {
            if (msgArea.innerText !== MSG_ERROR) msgArea.innerText = MSG_ERROR;
        } 
        // 確認系
        else if (txt.length > 0 && txt !== MSG_CONFIRM && txt !== MSG_COMPLETE && !txt.includes("OK") && !txt.includes("Cancel")) {
            msgArea.innerText = MSG_CONFIRM;
        }
        popup.style.setProperty('height', 'auto', 'important');
    };

    /**
     * 3. 各種リセット・オーバーライド
     */
    const overrideKbAlert = () => {
        if (typeof kb !== 'undefined' && kb.alert && !kb.alert._isOverridden) {
            const originalAlert = kb.alert;
            kb.alert = function(msg) {
                let customMsg = msg;
                if (msg && (msg.includes("誤り") || msg.includes("必須"))) customMsg = MSG_ERROR;
                else if (msg === "Done!") customMsg = MSG_COMPLETE;
                const result = originalAlert.apply(this, [customMsg]);
                setTimeout(updatePopupByContent, 50);
                return result;
            };
            kb.alert._isOverridden = true;
        }
    };

    const resetPostalInput = () => {
        const parentField = document.querySelector('[field-id="郵便番号"]');
        if (!parentField) return;
        const oldContainer = parentField.querySelector('.postal-box-container');
        if (oldContainer) oldContainer.remove();
        const input = parentField.querySelector('input');
        if (input) {
            input.style.display = 'block';
            input.style.position = 'static';
            input.style.opacity = '1';
        }
    };

    /**
     * 4. バリデーション
     */
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        document.querySelectorAll('[field-id]').forEach(el => {
            el.querySelectorAll('.error-input').forEach(e => e.classList.remove('error-input'));
            const existing = el.querySelector('.custom-error-container');
            if (existing) existing.remove();
        });

        const zipVal = (record["郵便番号"]?.value || "").replace(/[^\d]/g, "");
        if (zipVal && zipVal.length !== 7) hasError = true;

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
        if (hasError && typeof kb !== 'undefined' && kb.alert) kb.alert(MSG_ERROR);
        return !hasError;
    };

    // --- メインイベントリスナー ---
    document.addEventListener('change', (e) => {
        // キャリア選択のセレクトボックスが変更された時
        if (e.target.tagName === 'SELECT') {
            // valueが含まれているか、もしくは特定のクラス等で判定
            updateCarrierGuidance(e.target.value);
        }
    });

    document.addEventListener('input', (e) => {
        const fieldWrap = e.target.closest('[field-id]');
        if (!fieldWrap) return;
        const fieldId = fieldWrap.getAttribute('field-id');
        let val = e.target.value;
        if (fieldId === "郵便番号") {
            let d = val.replace(/[^\d]/g, "");
            e.target.value = d.length <= 3 ? d : d.slice(0, 3) + "-" + d.slice(3, 7);
        } else if (fieldId && fieldId.includes("電話番号")) {
            e.target.value = val.replace(/[^\d]/g, "").slice(0, 11);
        }
    });

    // 定期監視
    setInterval(() => {
        updatePopupByContent();
        overrideKbAlert();
        resetPostalInput();
    }, 500);

    if (typeof kb !== 'undefined' && kb.event) {
        kb.event.on(['kb.create.submit', 'kb.edit.submit'], (ev) => {
            if (!validateAll(ev.record)) ev.error = true;
            else setTimeout(updatePopupByContent, 100);
            return ev;
        });
    }
})();
