(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];
    const iconBase64 = "https://mobile-router-boost-js.vercel.app/customize/image/error-message_Triangle.png";

    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        removeError(fieldId);

        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');

        // エラーエリアのラッパー
        const errorWrap = document.createElement('div');
        errorWrap.className = 'custom-error-container';

        // 三角形アイコン
        const icon = document.createElement('img');
        icon.src = "data:image/png;base64," + iconBase64;
        icon.className = 'error-icon-tri';

        // エラーラベル (span)
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.innerText = message;

        errorWrap.appendChild(icon);
        errorWrap.appendChild(errorSpan);
        container.appendChild(errorWrap);
    };

    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.remove('error-input');
        const existing = container.querySelector('.custom-error-container');
        if (existing) existing.remove();
    };

    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        const telCheck = (id, label) => {
            if (!(record[id]?.value || "").match(/^\d{10,11}$/)) {
                showError(id, "数字のみ10〜11桁で入力してください");
                hasError = true;
            }
        };

        telCheck("連絡先電話番号");
        telCheck("モバイルルーターの電話番号");
        if (isDiff) telCheck("返送先対象者の電話番号");

        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!(record["連絡先メールアドレス"]?.value || "").match(mailRegex)) {
            showError("連絡先メールアドレス", "正しいメールアドレスの形式で入力してください");
            hasError = true;
        }
        if (isDiff && !(record["返送先対象者のメールアドレス"]?.value || "").match(mailRegex)) {
            showError("返送先対象者のメールアドレス", "正しいメールアドレスの形式で入力してください");
            hasError = true;
        }

        if (!(record["郵便番号"]?.value || "").match(/^\d{7}$/)) {
            showError("郵便番号", "数字7桁で入力してください");
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

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            kb.event.on('kb.view.show', (ev) => { document.body.classList.toggle("show-target-fields", ev.record["返送先対象者確認"]?.value === "返送先が異なる"); return ev; });
            kb.event.on('kb.change.返送先対象者確認', (ev) => { 
                const isDiff = ev.record["返送先対象者確認"]?.value === "返送先が異なる";
                document.body.classList.toggle("show-target-fields", isDiff);
                if(!isDiff) targetFieldIds.forEach(id => { if(ev.record[id]) ev.record[id].value = ""; });
                return ev; 
            });
            kb.event.on('kb.create.submit', (ev) => { if (!validateAll(ev.record)) ev.error = true; return ev; });
        }
    }, 100);
})();
