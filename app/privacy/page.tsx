import { WORK_RETENTION_DAYS } from '@/lib/retention';

const serviceName = 'AUTO 動態貼圖';
const operatorName = 'SU-SUI';
const contactEmail = 'sui@su-sui.com';
const effectiveDate = '2026-06-02';

const dataRows = [
  {
    type: '帳戶資料',
    examples: 'Email、使用者 ID、登入狀態、App 偏好設定',
    purpose: '登入、帳戶管理、客服、資安與防止濫用',
    retention: '帳戶存在期間保存；刪除帳戶後，依法令、帳務、資安或爭議處理需要保留必要資料。',
  },
  {
    type: '素材與生成作品',
    examples: '上傳照片、角色素材、風格提示詞、生成貼圖、main.png、tab.png、QC 報告',
    purpose: '產生 LINE 靜態貼圖、檢查格式、提供下載、處理客服與除錯',
    retention: `作品頁與圖片下載自生成完成日起保留 ${WORK_RETENTION_DAYS} 天；到期後可能清除作品頁、圖片、ZIP 備份與 QC 頁面。使用者應先下載到自己的手機或裝置。`,
  },
  {
    type: '交易與點數紀錄',
    examples: '付款狀態、點數交易、退款紀錄、發票或帳務所需資訊',
    purpose: '付款、對帳、退款、客服與交易爭議處理',
    retention: '依會計、稅務、消費者保護、金流稽核與爭議處理所需期間保存。',
  },
  {
    type: '技術與安全紀錄',
    examples: 'IP 位址、裝置資訊、錯誤紀錄、API 請求時間、下載紀錄',
    purpose: '維持服務安全、防止濫用、除錯、改善效能與確認下載流程',
    retention: '依安全稽核、系統維護、除錯與爭議處理所需期間保存。',
  },
];

const rights = [
  '查詢或請求閱覽個人資料。',
  '請求製給複製本。',
  '請求補充或更正資料。',
  '請求停止蒐集、處理、利用或請求刪除資料。',
  '本服務得因法令、帳務、資安、契約履行或爭議處理需要，保留必要資料。',
];

export default function PrivacyPage() {
  return (
    <main className="wide-page legal-page">
      <div className="page-header">隱私與授權</div>
      <section className="card desktop-card">
        <p className="muted">生效日：{effectiveDate}</p>
        <h2>隱私政策摘要</h2>
        <p>
          {serviceName} 由 {operatorName} 提供，用於協助使用者上傳素材、輸入風格描述，並產生可下載的 LINE 靜態貼圖圖片。
          本政策說明我們如何蒐集、處理、利用、保存與保護使用者資料。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>作品保留期限</h2>
        <p>
          作品頁、生成圖片、主圖、標籤圖、QC 報告與系統備份檔，預設自生成完成日起保留 {WORK_RETENTION_DAYS} 天。
          到期後可能自動清除或停止下載，不另保證可復原。請使用者完成檢查後先下載到手機、雲端硬碟或自己的裝置。
        </p>
        <p>
          已下載到使用者裝置的圖片不受本服務保留期限影響。付款、點數、客服、安全與爭議處理紀錄，會依必要目的另行保存。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>蒐集與保存資料</h2>
        <div className="legal-table">
          {dataRows.map((row) => (
            <div className="legal-row" key={row.type}>
              <h3>{row.type}</h3>
              <p><b>資料範例：</b>{row.examples}</p>
              <p><b>使用目的：</b>{row.purpose}</p>
              <p><b>保存期間：</b>{row.retention}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card desktop-card">
        <h2>素材與生成授權</h2>
        <p>
          使用者保留其上傳素材與依法享有之生成結果權利。為了提供服務，使用者授權本服務於必要範圍內重製、暫存、處理、裁切、去背、轉檔、
          送交 AI 或圖像處理供應商、產生衍生圖像、建立 QC 報告與提供下載。
        </p>
        <p>
          本服務不會將使用者的私人作品公開展示、販售、轉授權給第三人作為素材庫，或用於與本服務無關的廣告追蹤。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>使用者權利</h2>
        <ul className="doc-list">
          {rights.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>隱私、授權、刪除資料或權利行使問題，請聯繫：{contactEmail}。</p>
      </section>

      <section className="card desktop-card">
        <h2>平台與審核提醒</h2>
        <p>
          本服務可協助檢查圖片尺寸、透明背景、檔案大小、張數、主圖與標籤圖，但不代表 LINE、Apple 或 Google 已審核或保證通過。
          使用者仍須自行確認作品內容、權利來源、商品資訊、描述文字、價格、稅務與平台帳號設定符合各平台規範。
        </p>
      </section>
    </main>
  );
}
