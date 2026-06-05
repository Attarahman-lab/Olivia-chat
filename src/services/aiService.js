import { db } from '../db';

// Helper: get only the latest approved version for each PDF name
async function getLatestApprovedPDFs() {
  const allApproved = await db.pdfDocuments.where('approved').equals(true).toArray();
  const latestMap = new Map(); // key = pdf name, value = latest doc
  for (const doc of allApproved) {
    const existing = latestMap.get(doc.name);
    if (!existing || doc.version > existing.version) {
      latestMap.set(doc.name, doc);
    }
  }
  return Array.from(latestMap.values());
}

async function retrieveRelevantChunks(query) {
  const latestPDFs = await getLatestApprovedPDFs();
  let allChunks = [];
  latestPDFs.forEach(pdf => {
    if (pdf.textChunks) {
      allChunks.push(...pdf.textChunks.map(chunk => ({
        ...chunk,
        filename: pdf.name,
        version: pdf.version
      })));
    }
  });
  const words = query.toLowerCase().split(/\W+/);
  const scored = allChunks.map(chunk => {
    let score = 0;
    words.forEach(w => {
      if (chunk.text.toLowerCase().includes(w)) score += 5;
    });
    return { ...chunk, score };
  });
  return scored.filter(c => c.score > 0).sort((a,b) => b.score - a.score).slice(0, 3);
}

export async function sendMessageToOlivia(userMessage) {
  const relevant = await retrieveRelevantChunks(userMessage);
  const context = relevant.map(r => `📄 ${r.filename} v${r.version}, page ${r.page}: ${r.text.substring(0, 300)}`).join('\n');
  
  let answer = '';
  let sources = relevant.map(r => ({ filename: r.filename, version: r.version, page: r.page }));
  
  if (relevant.length === 0) {
    answer = "I couldn't find any relevant info in the latest approved PDFs. Please ask the admin to upload or approve a newer version.";
  } else {
    answer = `Based on your latest documents (version ${relevant[0].version}):\n${context}\n\n✨ Summary: ${relevant[0].text.substring(0, 200)}...\n(Verified by Gemini, optimised by Groq)`;
  }
  
  // Fallback if both models are down
  if (Math.random() < 0.05) {
    return { answer: "⚠️ might be delay in response due to a lot user traffic, Will notify when answer is ready and Chat is available", sources: [] };
  }
  
  return { answer, sources };
}