const serviceName = 'AUTO Sticker';
const operatorName = 'SU-SUI';
const contactEmail = 'sui@su-sui.com';
const effectiveDate = '2026-06-05';

const requestItems = [
  'The email address you use to contact support.',
  'Any project, work, export, or generation job identifiers you want us to review.',
  'A short description of the data you want deleted or corrected.',
];

const retainedItems = [
  'Records that must be kept for security, fraud prevention, legal compliance, dispute handling, or accounting obligations.',
  'Backups that are rotated out through normal retention processes.',
  'Aggregated or anonymized records that no longer identify you.',
];

export default function DataDeletionPage() {
  return (
    <main className="wide-page legal-page">
      <div className="page-header">Data Deletion</div>

      <section className="card desktop-card">
        <p className="muted">Effective date: {effectiveDate}</p>
        <h2>{serviceName} data deletion request</h2>
        <p>
          {serviceName} is operated by {operatorName}. To request deletion of app data associated
          with your use of the service, contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p>
          We will review your request, confirm the information needed to locate the relevant records,
          and delete or anonymize eligible data according to applicable law and our retention policy.
        </p>
      </section>

      <section className="card desktop-card">
        <h2>What to include</h2>
        <ul className="doc-list">
          {requestItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="card desktop-card">
        <h2>Processing time</h2>
        <p>
          We aim to respond to deletion requests within 30 days. If we need more information to
          verify or complete the request, we will reply using the email address you provide.
        </p>
      </section>

      <section className="card desktop-card">
        <h2>Data we may retain</h2>
        <ul className="doc-list">
          {retainedItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="card desktop-card">
        <h2>Contact</h2>
        <p>
          Data deletion contact: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </section>
    </main>
  );
}
