(function() {
    "use strict";

    const updateVisibility = (record) => {
        const isDifferent = record["返送先対象者確認"]?.value === "返送先が異なる";
        const body = document.body;
        
        if (isDifferent) {
            body.classList.add("show-target-fields");
        } else {
            body.classList.remove("show-target-fields");
        }
    };

    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            
            kb.event.on('kb.view.show', (event) => {
                // 初期状態はCSSで非表示なので、ここでは何もしなくてOK
                updateVisibility(event.record);
                return event;
            });

            kb.event.on('kb.change.返送先対象者確認', (event) => {
                updateVisibility(event.record);
                return event;
            });

            kb.event.on('kb.create.submit', (event) => {
                const record = event.record;
                if (record["返送先対象者確認"].value === "返送先が異なる") {
                    const fields = ["返送先対象者の氏名", "返送先対象者の会社名", "返送先対象者の電話番号", "返送先対象者のメールアドレス"];
                    const empty = fields.filter(id => !record[id]?.value?.trim());
                    if (empty.length > 0) {
                        alert("「返送先が異なる」場合は、全ての項目を入力してください。");
                        event.error = true;
                    }
                }
                return event;
            });
        }
    }, 100);
})();
