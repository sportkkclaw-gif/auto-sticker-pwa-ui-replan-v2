import { WORK_RETENTION_DAYS } from '@/lib/retention';

const serviceName = 'AUTO 動態貼圖';
const operatorName = 'SU-SUI';
const contactEmail = 'sui@su-sui.com';
const effectiveDate = '2026-06-02';

const userWarranties = [
  '使用者確認上傳素材、人物肖像、角色、商標與文字由自己合法持有或已取得授權。',
  '若素材包含真人、兒少、員工、客戶、寵物飼主資訊、商業攝影或委託作品，使用者已取得必要同意與授權文件。',
  '使用者會自行保存授權、同意書、委託合約、購買證明或其他權利來源文件，以便平台、權利人或主管機關要求時提出。',
  '使用者不得要求本服務模仿既有 IP、名人、品牌吉祥物、受保護角色或可能侵害他人權利的內容。',
];

const refundRules = [
  '生成任務因系統錯誤、AI 供應商錯誤或格式 QC 未通過而未提供可下載圖片時，不應扣除成功產出點數；已扣點者應返還等值點數。',
  '已成功產生並允許下載圖片後，除法律另有強制規定或本服務另行公告外，視為數位內容已開始提供，通常不適用無條件退費。',
  '使用者下載作品後，仍應自行確認 LINE Creators Market 或其他平台的審核與上架要求。',
];

const prohibitedContent = [
  '侵害著作權、商標、肖像權、隱私權、營業秘密或其他第三人權利的內容。',
  '仇恨、騷擾、暴力、成人、違法、詐欺、誤導或平台禁止上架的內容。',
  '冒充他人、模仿名人、模仿既有 IP、使用真實品牌 Logo 或可能造成混淆的內容。',
  '未經授權使用真人照片、兒少照片、客戶資料、醫療或其他敏感個資的內容。',
];

export default function TermsPage() {
  return (
    <main className="wide-page legal-page">
      <div className="page-header">服務條款</div>
      <section className="card desktop-card">
        <p className="muted">生效日：{effectiveDate}</p>
        <h2>服務內容</h2>
        <p>
          歡迎使用 {serviceName}。本服務由 {operatorName} 提供，協助使用者上傳素材、輸入風格描述，並生成可下載的 LINE 靜態貼圖圖片。
          使用本服務前，請確認你已閱讀並同意本條款與隱私授權政策。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>作品保留與下載</h2>
        <p>
          作品頁、生成貼圖、主圖、標籤圖、QC 報告與系統備份檔，預設自生成完成日起保留 {WORK_RETENTION_DAYS} 天。
          到期後本服務可能清除作品頁或停止下載，不保證可復原。使用者應在期限內將圖片下載到手機、雲端硬碟或自己的裝置。
        </p>
        <p>
          已下載到使用者裝置的圖片不受本服務保留期限影響。付款、點數、客服、安全與爭議處理紀錄，得依必要目的另行保存。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>使用者責任</h2>
        <ul className="doc-list">
          {userWarranties.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="card desktop-card">
        <h2>禁止內容</h2>
        <p>使用者不得利用本服務建立、上傳、生成、下載、上架或散布以下內容：</p>
        <ul className="doc-list">
          {prohibitedContent.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>
          若本服務合理判斷內容違反法令、平台規範或本條款，得拒絕生成、移除內容、撤銷下載、暫停帳戶、限制點數使用或保存必要證據。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>AI 與平台審核限制</h2>
        <p>
          AI 生成結果可能出現構圖瑕疵、文字錯誤、相似風格、主體異常或未符合平台審美等問題。本服務的 QC 只能協助檢查格式與部分視覺風險，
          不保證 LINE Creators Market 或任何第三方平台一定審核通過。
        </p>
      </section>

      <section className="card desktop-card">
        <h2>點數與退費</h2>
        <ul className="doc-list">
          {refundRules.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="card desktop-card">
        <h2>聯絡方式</h2>
        <p>服務、條款、退款、資料刪除或權利問題，請聯繫：{contactEmail}。</p>
      </section>
    </main>
  );
}
