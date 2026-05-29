const serviceName = 'AUTO 動態貼圖';
const operatorName = 'AUTO 動態貼圖營運團隊';
const contactEmail = 'support@auto-sticker.example';
const effectiveDate = '2026-05-27';

const dataRows = [
  {
    type: '帳戶與聯絡資料',
    examples: '電子郵件、顯示名稱、使用者 ID、登入紀錄',
    purpose: '建立帳戶、身分驗證、客服聯繫、寄送重要服務通知',
    retention: '帳戶存在期間；刪除帳戶後依法令、爭議處理或備份週期保留必要期間',
  },
  {
    type: '上傳素材與生成內容',
    examples: '使用者上傳的照片、插圖、角色素材、風格 prompt、生成貼圖、QC 報告、下載 ZIP',
    purpose: '產生 LINE 靜態貼圖包、去背、裁切、格式檢查、錯誤排除與使用者要求的重新生成',
    retention: '作品保留至使用者刪除或帳戶終止；暫存檔、失敗任務與日誌依系統維護週期清除',
  },
  {
    type: '交易與點數資料',
    examples: '購買紀錄、點數餘額、扣點紀錄、付款狀態、發票或退款處理所需資訊',
    purpose: '提供付費功能、帳務管理、退款、稅務與交易爭議處理',
    retention: '依會計、稅務、消費者保護及交易爭議處理所需期間保存',
  },
  {
    type: '裝置、使用與安全紀錄',
    examples: 'IP 位址、瀏覽器/裝置資訊、錯誤紀錄、API 請求時間、下載與匯出紀錄',
    purpose: '維持服務安全、防止濫用、除錯、改善效能、確認 QC 與下載流程',
    retention: '依安全稽核、系統維護與爭議處理所需期間保存',
  },
];

const rights = [
  '查詢或請求閱覽本服務持有的個人資料。',
  '請求製給複製本。',
  '請求補充或更正不完整或不正確的資料。',
  '請求停止蒐集、處理或利用。',
  '請求刪除資料，但本服務得依法令、契約履行、帳務、資安、爭議處理或其他正當理由保留必要資料。',
];

const prohibitedUploads = [
  '未取得授權的真人照片、他人肖像、名人、角色、商標、品牌識別、粉絲二創或其他可能侵害權利的素材。',
  '身分證件、金融資料、醫療資料、兒少私密影像、密碼、定位軌跡或其他高度敏感個資。',
  '違法、仇恨、騷擾、成人性內容、血腥暴力、自傷、詐欺、政治煽動、賭博、毒品、武器或可能違反 LINE Creators Market 審核規範的內容。',
];

export default function PrivacyPage() {
  return (
    <main className="wide-page legal-page">
      <div className="page-header">隱私與授權</div>
      <section className="card desktop-card">
        <p className="muted">生效日：{effectiveDate}</p>
        <h2>一、政策適用範圍</h2>
        <p>
          本隱私與授權政策說明 {serviceName} 由 {operatorName} 提供服務時，如何蒐集、處理、利用、保存與保護使用者資料。
          本服務的核心功能是讓使用者上傳素材、輸入風格描述，並自動產生可供 LINE Creators Market 上傳檢查的靜態 PNG 貼圖包。
        </p>
        <p>
          本頁同時作為台灣個人資料保護法告知事項、App Store / Google Play 上架審查所需的隱私政策，以及使用者上傳素材之處理授權說明。
          若正式營運主體、聯絡信箱、第三方供應商或資料處理方式變更，應於上架前同步更新本頁。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>二、個人資料告知事項</h2>
        <p>
          蒐集機關或非公務機關名稱：{operatorName}。蒐集目的包含會員管理、AI 圖像生成、貼圖格式檢查、客戶服務、交易管理、資訊安全、
          系統營運、法令遵循與爭議處理。資料利用地區包含台灣，以及雲端主機、AI 服務、付款、客服或安全供應商實際處理資料之所在地。
        </p>
        <p>
          若使用者選擇不提供必要資料，本服務可能無法完成登入、素材上傳、AI 生成、QC 檢查、ZIP 下載、付款、退款或客服處理。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>三、我們蒐集的資料</h2>
        <div className="legal-table">
          {dataRows.map((row) => (
            <div className="legal-row" key={row.type}>
              <h3>{row.type}</h3>
              <p><b>可能包含：</b>{row.examples}</p>
              <p><b>使用目的：</b>{row.purpose}</p>
              <p><b>保存期間：</b>{row.retention}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card desktop-card">
        <h2>四、素材、肖像與 AI 生成授權</h2>
        <p>
          使用者保留其上傳素材與依法享有之生成結果權利。為了提供服務，使用者授權本服務於必要範圍內重製、暫存、處理、裁切、去背、轉檔、
          送交 AI 或圖像處理供應商、產生衍生圖像、建立 QC 報告與輸出 ZIP。此授權限於提供、維護、改善、除錯、客服與安全稽核本服務所需。
        </p>
        <p>
          本服務不會將使用者的私人作品公開展示、販售、轉授權給第三人作為素材庫，或用於與本服務無關的廣告追蹤。若未來要將使用者作品作為案例、
          宣傳、模型訓練或公開展示，應另行取得明確同意。
        </p>
        <p>
          若素材包含真人、兒少、員工、客戶、藝人、網紅或第三方角色，使用者必須確認已取得肖像、著作權、商標、商品化、公開發表、改作、散布、
          上架販售與跨境處理所需同意或授權文件。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>五、第三方處理與跨境傳輸</h2>
        <p>
          為完成生成、儲存、付款、客服、分析或資安目的，本服務可能委託第三方處理資料，例如 AI 圖像生成服務、雲端主機、物件儲存、
          付款服務、錯誤追蹤、電子郵件與客服系統。第三方僅能在受託目的與必要範圍內處理資料，並應採取合理安全措施。
        </p>
        <p>
          使用 AI 圖像生成時，上傳素材、文字 prompt 與必要的任務資訊可能被傳輸至台灣以外地區處理。使用者送出生成任務，即表示理解此跨境處理是完成服務所必要。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>六、敏感資料、兒少與禁止上傳內容</h2>
        <p>
          本服務不是身分識別、醫療、金融、徵信、背景調查或兒少資料管理工具。請勿上傳以下內容：
        </p>
        <ul className="doc-list">
          {prohibitedUploads.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>
          若使用者上傳包含兒少、醫療、犯罪紀錄、性生活、基因、健康檢查或其他敏感資訊之素材，本服務得拒絕處理、刪除內容、限制帳戶或要求補充授權證明。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>七、使用者權利</h2>
        <p>依台灣個人資料保護法，使用者可就其個人資料行使下列權利：</p>
        <ul className="doc-list">
          {rights.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>
          請透過 {contactEmail} 聯繫我們。為保護資料安全，我們可能要求驗證身分。依法得收取必要成本費用，並於法定或合理期間內回覆。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>八、Cookie、權限與追蹤</h2>
        <p>
          本服務可能使用 Cookie、localStorage 或類似技術維持登入狀態、保存草稿、記錄偏好、提供離線/PWA 功能與保護帳戶安全。
          若未來加入廣告、跨 App 追蹤、再行銷 SDK、精準定位、通訊錄、相簿背景存取或其他超出使用者合理預期的資料處理，應先於 App 內以醒目方式告知並取得同意。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>九、資訊安全與資料外洩處理</h2>
        <p>
          本服務採取合理技術與組織措施保護資料，例如權限控管、傳輸加密、日誌稽核、最小必要存取、備份與刪除流程。
          若發生個人資料遭竊、洩漏、竄改或其他資安事件，本服務將依事件性質採取補救措施，並依適用法令通知使用者或主管機關。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>十、LINE 與上架聲明</h2>
        <p>
          本服務可協助檢查 PNG 尺寸、透明背景、檔案大小、張數、main.png、tab.png 與 ZIP 結構，但不代表 LINE、Apple 或 Google 已審核或保證通過。
          使用者仍須自行確認作品內容、權利來源、商品資訊、描述文字、價格、發票稅務與平台帳號設定符合各平台規範。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>十一、政策更新與聯絡方式</h2>
        <p>
          我們可能因功能、法令、平台政策或供應商變更而更新本政策。重大變更會以 App 內公告、電子郵件或其他合理方式通知。
          隱私、授權、刪除資料或權利行使問題，請聯繫：{contactEmail}。
        </p>
        <p className="muted">
          備註：本頁是產品隱私與授權政策範本，正式商轉或送審前，建議由台灣執業律師依實際公司、金流、資料流、供應商與上架地區完成審閱。
        </p>
      </section>
    </main>
  );
}
