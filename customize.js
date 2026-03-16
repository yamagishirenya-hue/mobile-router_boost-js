<script>
(function() {
    "use strict";

    // 対象フィールドID
    const targetFieldIds = [
        "返送先対象者の氏名",
        "返送先対象者の住所",
        "返送先対象者の電話番号",
        "返送先対象者のメールアドレス"
    ];

    const updateVisibility = (record) => {
        if (!record || !record["返送先対象者確認"]) return;
        const isDifferent = record["返送先対象者確認"].value === "返送先が異なる";
        
        targetFieldIds.forEach(fieldId => {
            const el = document.querySelector(`[field-id="${fieldId}"]`);
            if (el) {
                el.style.display = isDifferent ? "block" : "none";
            }
        });
    };

    const registerEvents = () => {
        console.log("Boost! Injector: Logic Started.");

        // 1. 画面表示時
        kb.event.on('kb.view.show', (event) => {
            const record = event.record;
            if (!record["返送先対象者確認"].value) {
                record["返送先対象者確認"].value = "ご依頼者様ご本人";
            }
            updateVisibility(record);
            return event;
        });

        // 2. 値変更時
        kb.event.on('kb.change.返送先対象者確認', (event) => {
            updateVisibility(event.record);
            return event;
        });

        // 3. 送信前バリデーション
        kb.event.on('kb.create.submit', (event) => {
            const record = event.record;
            if (record["返送先対象者確認"].value === "返送先が異なる") {
                let emptyFields = [];
                targetFieldIds.forEach(fieldId => {
                    const val = record[fieldId] ? record[fieldId].value : "";
                    if (!val || !val.trim()) emptyFields.push(fieldId);
                });
                if (emptyFields.length > 0) {
                    alert("「返送先が異なる」場合は、全ての項目を入力してください。");
                    event.error = true;
                }
            }
            return event;
        });

        // 初期実行（すでに描画されている場合）
        if (kb.record) {
            updateVisibility(kb.record.get());
        }
    };

    // kbオブジェクトを待つ
    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            registerEvents();
        }
    }, 100);
})();
</script>



