import { useEffect, useState } from 'react';
import { db } from '../db';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Admin() {
  const [pdfs, setPdfs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [file, setFile] = useState(null);

  const loadData = async () => {
    setPdfs(await db.pdfDocuments.toArray());
    const convs = await db.conversations.toArray();
    const full = await Promise.all(convs.map(async c => {
      const msgs = await db.messages.where('conversationId').equals(c.id).toArray();
      return { ...c, messages: msgs };
    }));
    setConversations(full);
  };

  useEffect(() => { loadData(); }, []);

  const uploadPDF = async () => {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    let chunks = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str).join(' ');
      fullText += strings;
      chunks.push({ page: i, text: strings });
    }
    const existingVersions = pdfs.filter(p => p.name === file.name).length;
    const newVersion = existingVersions + 1;
    await db.pdfDocuments.add({
      name: file.name,
      version: newVersion,
      approved: false,
      uploadedBy: 'admin@example.com',
      uploadedAt: Date.now(),
      fileData: arrayBuffer,
      textChunks: chunks
    });
    alert('PDF uploaded, pending admin approval');
    loadData();
  };

  const approvePDF = async (id) => {
    await db.pdfDocuments.update(id, { approved: true });
    loadData();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-futura text-brand-purple">Admin Panel</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-bold">📄 PDF Versioning</h2>
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} />
          <button onClick={uploadPDF} className="bg-brand-orange text-white p-2 rounded mt-2">Upload new version</button>
          <ul className="mt-4">
            {pdfs.map(pdf => (
              <li key={pdf.id} className="border-b py-2">
                <strong>{pdf.name}</strong> v{pdf.version} – {pdf.approved ? '✅ Approved' : '⏳ Pending'}
                {!pdf.approved && <button onClick={() => approvePDF(pdf.id)} className="ml-2 bg-green-500 text-white p-1 rounded">Approve</button>}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-xl font-bold">💬 All Conversations (last 7 days)</h2>
          {conversations.map(conv => (
            <details key={conv.id} className="border p-2 my-2">
              <summary>User {conv.userId} – {new Date(conv.createdAt).toLocaleString()}</summary>
              {conv.messages.map((m, i) => <p key={i}><strong>{m.role}:</strong> {m.content.substring(0, 100)}</p>)}
            </details>
          ))}
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-gray-400">
        <a href="/privacy" className="underline">Privacy Policy (GDPR/CCPA)</a> | Data retained for 7 days
      </div>
    </div>
  );
}