/* --- 1. ベースデザイン --- */
body { background-color: #f0f2f5 !important; margin: 0; }
body .kb-injector { 
    max-width: 800px !important; margin: 40px auto !important; padding: 32px !important; 
    background: #ffffff !important; border-radius: 16px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; 
}
[field-id] { margin-bottom: 32px !important; clear: both; }

/* ラベル基本 */
.kb-field-caption { 
    font-weight: 600 !important; color: #1a1a1a !important; font-size: 17px !important; line-height: 1.5 !important; 
    display: block !important; margin-bottom: 12px !important;
}

/* --- 文字装飾クラス --- */
/* 赤い必須ラベル */
.custom-req {
    color: #e53935 !important;
    font-weight: bold !important;
    margin: 0 4px !important;
}
/* 控えめな注釈 */
.custom-note {
    display: block !important;
    font-size: 13px !important;
    color: #888 !important;
    opacity: 0.8 !important;
    font-weight: normal !important;
    margin-top: 4px !important;
    line-height: 1.4 !important;
}

/* 入力フォーム */
body .kb-injector input, body .kb-injector select, body .kb-injector textarea { 
    width: 100% !important; padding: 14px 16px !important; border: 1.5px solid #e0e4e8 !important; border-radius: 10px !important; font-size: 16px !important; 
}

/* --- 2. 出し分けエリア --- */
[field-id="返送先対象者の氏名"],[field-id="返送先対象者の会社名"],[field-id="返送先対象者の電話番号"],[field-id="返送先対象者のメールアドレス"] { display: none !important; }
.show-target-fields [field-id="返送先対象者の氏名"], .show-target-fields [field-id="返送先対象者の会社名"], .show-target-fields [field-id="返送先対象者の電話番号"], .show-target-fields [field-id="返送先対象者のメールアドレス"] {
    display: block !important; background-color: #f8fbff !important; padding: 10px 20px !important; margin-bottom: 0 !important; border-left: 5px solid #007bff !important;
}

/* --- 3. エラー項目デザイン（21px） --- */
.custom-error-container { margin-top: 10px !important; display: block !important; position: relative !important; }
.error-triangle { width: 0 !important; height: 0 !important; border-left: 12px solid transparent !important; border-right: 12px solid transparent !important; border-bottom: 14px solid rgb(183, 40, 46) !important; margin-left: 1.5em !important; display: block !important; visibility: visible !important; }
body .kb-injector .error-message { background-color: rgb(183, 40, 46) !important; color: #ffffff !important; border-radius: 0.25em !important; display: block !important; line-height: 2.2em !important; margin: -1px 0 0 0 !important; padding: 0 0.8em !important; font-size: 21px !important; font-weight: 500 !important; }
body .kb-injector input.error-input { border-color: rgb(183, 40, 46) !important; background-color: #fff8f8 !important; }

/* --- 4. ポップアップ --- */
div[style*="rgb(240, 240, 240)"] { background-color: #ffffff !important; border-radius: 12px !important; box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important; padding-bottom: 60px !important; overflow: hidden !important; min-width: 300px !important; }
div[style*="height: 56px"] { height: auto !important; min-height: 80px !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 18px !important; font-weight: bold !important; color: #333 !important; padding: 30px 20px !important; text-align: center !important; }
div[style*="border-top: 1px solid rgb(66, 165, 245)"] { border-top: 1px solid #eee !important; background: #f9f9f9 !important; padding: 10px !important; }
.kb-dialog-button { background-color: #007bff !important; color: #ffffff !important; border-radius: 6px !important; height: 44px !important; line-height: 44px !important; font-size: 16px !important; font-weight: bold !important; width: calc(100% - 20px) !important; margin: 5px 10px !important; }

/* --- 5. 送信ボタン --- */
.submit-button, .kb-injector-button { width: 100% !important; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important; color: #fff !important; padding: 18px !important; border-radius: 12px !important; font-size: 18px !important; font-weight: 700 !important; margin-top: 40px !important; border: none !important; }
