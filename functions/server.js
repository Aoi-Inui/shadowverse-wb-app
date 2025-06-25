// 1. 必要な部品を読み込む
const express = require('express');
const admin = require('firebase-admin');

// 2. Firebaseの初期化
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 3. Expressアプリの準備
const app = express();
const port = 3000;

// (A) JSON形式のデータを受け取るための設定
app.use(express.json());
// (B) 'public'フォルダの中身を公開する設定
app.use(express.static('public'));

// (C) 戦績データを保存するためのAPIエンドポイント（窓口）
app.post('/api/battles', async (req, res) => {
  try {
    const battleData = req.body;
    
    // サーバー側でタイムスタンプを追加する方がより正確
    battleData.timestamp = new Date().toISOString();

    const docRef = await db.collection('battles').add(battleData);
    
    console.log('データが保存されました！ドキュメントID:', docRef.id);
    res.status(201).send({ id: docRef.id });

  } catch (error) {
    console.error('データの保存中にエラーが発生しました:', error);
    res.status(500).send({ message: 'サーバーでエラーが発生しました。' });
  }
});

// (G) 全ての戦績データを取得するためのAPIエンドポイント
app.get('/api/battles', async (req, res) => {
  try {
    // タイムスタンプの新しい順でデータを取得
    const snapshot = await db.collection('battles').orderBy('timestamp', 'desc').get();
    
    if (snapshot.empty) {
      return res.status(200).send([]); // データが一件もなくても空の配列を返す
    }

    const battles = [];
    snapshot.forEach(doc => {
      // ドキュメントIDとドキュメントのデータをまとめて配列に追加
      battles.push({ id: doc.id, ...doc.data() });
    });

    // 取得した戦績データ一覧をフロントに送る
    res.status(200).send(battles);

  } catch (error) {
    console.error('データの取得中にエラーが発生しました:', error);
    res.status(500).send({ message: 'サーバーでデータ取得エラーが発生しました。' });
  }
});

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★ ここが新しく追加された「データ削除して！」の窓口 ★
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// (H) 特定の戦績データを削除するためのAPIエンドポイント
app.delete('/api/battles/:id', async (req, res) => {
  try {
    // URLから削除したいデータのIDを取得 (例: /api/battles/A4bCdeFgH...)
    const battleId = req.params.id;
    
    // Firestoreから指定されたIDのドキュメントを削除
    await db.collection('battles').doc(battleId).delete();
    
    console.log(`データが削除されました！ドキュメントID: ${battleId}`);
    // フロントに「成功したよ！」と伝える
    res.status(200).send({ message: '削除に成功しました。' });

  } catch (error)
 {
    console.error('データの削除中にエラーが発生しました:', error);
    res.status(500).send({ message: 'サーバーで削除エラーが発生しました。' });
  }
});


// 5. サーバーを起動する
app.listen(port, () => {
  console.log(`サーバーがポート ${port} で起動しました。 http://localhost:${port}`);
  console.log('Webサイトは public/index.html が表示されます。');
});