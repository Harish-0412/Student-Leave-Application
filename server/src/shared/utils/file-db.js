const path = require('path');
const { getFirestore } = require('../../config/firebase-admin');

/**
 * Vercel Fix: Since the filesystem is read-only/ephemeral on Vercel,
 * we use Firestore for persistent storage while maintaining the file-based API.
 */
const useFirestore = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

const getCollectionName = (filePath) => {
  return path.basename(filePath, '.json');
};

const readJsonFile = async (filePath) => {
  if (!useFirestore) {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  try {
    const db = getFirestore();
    const collectionName = getCollectionName(filePath);
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Firestore read error for ${filePath}:`, error);
    return [];
  }
};

const writeJsonFile = async (filePath, data) => {
  if (!useFirestore) {
    const fs = require('fs').promises;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return;
  }

  try {
    const db = getFirestore();
    const collectionName = getCollectionName(filePath);
    const batch = db.batch();

    // Note: This simple implementation overwrites/syncs the whole collection
    // to match the file-based array behavior. For better performance, 
    // we should use direct document updates in repositories.
    
    // For now, to keep compatibility with the existing repository structure:
    for (const item of data) {
      if (!item.id) continue;
      const docRef = db.collection(collectionName).doc(item.id.toString());
      batch.set(docRef, item);
    }
    
    await batch.commit();
  } catch (error) {
    console.error(`Firestore write error for ${filePath}:`, error);
  }
};

module.exports = {
  readJsonFile,
  writeJsonFile,
};