(function() {
    "use strict";

    const targetFieldIds = [
        "返送先対象者の氏名",
        "返送先対象者の会社名",
        "返送先対象者の電話番号",
        "返送先対象者のメールアドレス"
    ];

    // エラーメッセージを表示する関数
    const showError = (fieldId, message) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;

        // 既存のエラーを削除
        removeError(fieldId);

        // 入力欄にエラー用クラスを追加
        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.add('error-input');

        // メッセージ要素を作成
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerText = message;
        container.appendChild(errorDiv);
    };

    // エラーメッセージを消去する関数
    const removeError = (fieldId) => {
        const container = document.querySelector(`[field-id="${fieldId}"]`);
        if (!container) return;

        const input = container.querySelector('input, select, textarea');
        if (input) input.classList.remove('error-input');

        const existingError = container.querySelector('.error-message');
        if (existingError) existingError.remove();
    };

    // バリデーションロジック本体
    const validateAll = (record) => {
        let hasError = false;
        
        // 全項目のエラーを一掃
        const allFields = document.querySelectorAll('[field-id]');
        allFields.forEach(el => removeError(el.getAttribute('field-id')));

        // 1. 電話番号チェック (数字のみ 10-11桁)
        const telFields = ["連絡先電話番号", "モバイルルーターの電話番号", "返送先対象者の電話番号"];
        const isDiff = record["返送先対象者確認"]?.value === "返送先が異なる";

        telFields.forEach(id => {
            // 「返送先」は表示時のみチェック
            if (id === "返送先対象者の電話番号" && !isDiff) return;

            const val = record[id]?.value || "";
            if (!val.match(/^\d{10,11}$/)) {
                showError(id, "数字のみ10桁〜11桁で入力してください");
                hasError = true;
            }
        });

        // 2. メールアドレスチェック
        const mailFields = ["連絡先メールアドレス", "返送先対象者のメールアドレス"];
        const mailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

        mailFields.forEach(id => {
            if (id === "返送先対象者のメールアドレス" && !isDiff) return;
            const val = record[id]?.value || "";
            if (!val.match(mailRegex)) {
                showError(id, "正しいメールアドレスの形式で入力してください");
                hasError = true;
            }
        });

        // 3. 郵便番号チェック (数字のみ 7桁)
        const zipVal = record["郵便番号"]?.value || "";
        if (!zipVal.match(/^\d{7}$/)) {
            showError("郵便番号", "数字7桁で入力してください(ハイフン不要)");
            hasError = true;
        }

        // 4. 「返送先が異なる」場合の必須チェック
        if (isDiff) {
            targetFieldIds.forEach(id => {
                const val = record[id]?.value || "";
                if (!val.trim()) {
                    showError(id, "この項目は必須です");
                    hasError = true;
                }
            });
        }

        return !hasError;
    };

    // 表示制御
    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        document.body.classList.toggle("show-target-fields", isDifferent);
        if (!isDifferent) {
            targetFieldIds.forEach(id => { if(record[id]) record[id].value = ""; });
        }
    };

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            
            kb.event.on('kb.view.show', (event) => {
                updateVisibility(event.record);
                return event;
            });

            kb.event.on('kb.change.返送先対象者確認', (event) => {
                updateVisibility(event.record);
                return event;
            });

            kb.event.on('kb.create.submit', (event) => {
                if (!validateAll(event.record)) {
                    event.error = true;
                }
                return event;
            });
        }
    }, 100);
})();
