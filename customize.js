// ブラウザのORB検知を回避するためのダミー定義
const __BOOST_INJECTOR_VALID_SCRIPT__ = true;

(function() {
    "use strict";

    console.log("Boost! Injector: Script loaded correctly.");

    const targetFieldIds = [
        "返送先対象者の氏名",
        "返送先対象者の会社名",
        "返送先対象者の電話番号",
        "返送先対象者のメールアドレス"
    ];

    // 表示・非表示を制御する関数
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

    // kbオブジェクトの準備を待機
    const timer = setInterval(() => {
        if (typeof kb !== 'undefined' && kb.event) {
            clearInterval(timer);
            
            // 1. 表示イベント (kb.view.show)
            kb.event.on('kb.view.show', (event) => {
                // 値をセット
                event.record["返送先対象者確認"].value = "ご依頼者様ご本人";
                
                // 画面上のラジオボタンやプルダウンにも強制的に反映させる処理
                setTimeout(() => {
                    const container = document.querySelector('[field-id="返送先対象者確認"]');
                    if (container) {
                        // ラジオボタンの場合
                        const radio = container.querySelector('input[value="ご依頼者様ご本人"]');
                        if (radio) {
                            radio.checked = true;
                            // changeイベントを発火させてプラグイン側に認識させる
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        // プルダウンの場合
                        const select = container.querySelector('select');
                        if (select) {
                            select.value = "ご依頼者様ご本人";
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                    updateVisibility(event.record);
                }, 100);

                return event;
            });

            // 2. 変更イベント
            kb.event.on('kb.change.返送先対象者確認', (event) => {
                updateVisibility(event.record);
                return event;
            });

            // 3. 送信前チェック
            kb.event.on('kb.create.submit', (event) => {
                const record = event.record;
                if (record["返送先対象者確認"].value === "返送先が異なる") {
                    const empty = targetFieldIds.filter(id => !record[id]?.value?.trim());
                    if (empty.length > 0) {
                        alert("「返送先が異なる」場合は、全ての項目を入力してください。");
                        event.error = true;
                    }
                }
                return event;
            });

            // 初期実行（念のためのバックアップ）
            if (kb.record) updateVisibility(kb.record.get());
        }
    }, 100);
})();
