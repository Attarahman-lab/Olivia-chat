import Dexie from 'dexie';

export const db = new Dexie('OliviaDB');
db.version(1).stores({
  users: '++id, email, role, createdAt',
  conversations: '++id, userId, createdAt, lastMessageAt',
  messages: '++id, conversationId, role, content, timestamp, sources, reported',
  pdfDocuments: '++id, name, version, approved, uploadedBy, uploadedAt, fileData, textChunks'
});

export async function cleanupOldConversations() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const oldConvs = await db.conversations.where('lastMessageAt').below(weekAgo).toArray();
  for (const conv of oldConvs) {
    await db.messages.where('conversationId').equals(conv.id).delete();
    await db.conversations.delete(conv.id);
  }
}