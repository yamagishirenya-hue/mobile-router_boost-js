(function() {
    "use strict";

    const targetFieldIds = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];

    // エラーメッセージを表示する関数 (標準デザインに合わせる)
    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;

        removeError(fieldId);

        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');

        // 標準と同じ span タグで作成
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.innerText = message;
        container.appendChild(errorSpan);
    };

    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.remove('error-input');
        const existingError = container.querySelector('.error-message');
        if (existingError) existingError.remove();
    };

    // バリデーションチェック
    const validateAll = (record) => {
        let hasError = false;
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";
        
        // 全クリア
        document.querySelectorAll('[field-id]').forEach(el => removeError(el.getAttribute('field-id')));

        // 電話番号 (10-11桁)
        ["連絡先電話番号", "モバイルルーターの電話番号", "返送先対象者の電話番号"].forEach(id => {
            if (id === "返送先対象者の電話番号" && !isDiff) return;
            if (!(record[id]?.value || "").match(/^\d{10,11}$/)) {
                showError(id, "数字のみ10〜11桁で入力してください");
                hasError = true;
            }
        });

        // メール
        ["連絡先メールアドレス", "返送先対象者のメールアドレス"].forEach(id => {
            if (id === "返送先対象者のメールアドレス" && !isDiff) return;
            const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            if (!(record[id]?.value || "").match(mailRegex)) {
                showError(id, "正しいメールアドレスの形式で入力してください");
                hasError = true;
            }
        });

        // 郵便番号 (7桁)
        if (!(record["郵便番号"]?.value || "").match(/^\d{7}$/)) {
            showError("郵便番号", "数字7桁で入力してください(ハイフン不要)");
            hasError = true;
        }

        // 返送先必須チェック
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
        if (!isDifferent) targetFieldIds.forEach(id => { if(record[id]) record[id].value = ""; });
    };

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            kb.event.on('kb.view.show', (ev) => { updateVisibility(ev.record); return ev; });
            kb.event.on('kb.change.返送先対象者確認', (ev) => { updateVisibility(ev.record); return ev; });
            kb.event.on('kb.create.submit', (ev) => {
                if (!validateAll(ev.record)) ev.error = true;
                return ev;
            });
        }
    }, 100);
})();
