import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider } from './services/firebase';
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
// 保留你原本的其他 imports（component, types, icons 等）
// import { TransactionForm } from './components/TransactionForm.tsx';
// ...

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // 監聽 Firebase Auth 狀態
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log('onAuthStateChanged', currentUser);
      setUser(currentUser);
      setLoadingAuth(false);
    }, (err) => {
      console.error('onAuthStateChanged error', err);
      setUser(null);
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 處理 redirect 登入回傳（可選，但有助於 debug）
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('getRedirectResult:', result);
          // 取得 credential 或 user 等資訊（如果需要）
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error:', err);
      });
  }, []);

  // 改為使用 redirect（不再使用 popup）
  const handleLogin = async () => {
    try {
      // 這會把使用者導向 Google 登入頁面，完成後再導回你的網域
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('signInWithRedirect error', err);
      alert(`登入失敗：${err?.code ?? ''} ${err?.message ?? err}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('signOut error', err);
    }
  };

  // 簡單 debug UI：幫助你確認是否為 auth 問題（上線前可移除）
  if (loadingAuth) return <div style={{ padding: 20 }}>Loading auth state...</div>;
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>尚未登入（debug）</h2>
        <p>請按下面按鈕登入（使用 redirect 流程）</p>
        <button onClick={handleLogin}>使用 Google 登入（Redirect）</button>
      </div>
    );
  }

  return (
    <div>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <span>已登入：{user.displayName ?? user.email ?? user.uid}</span>
        <button style={{ marginLeft: 12 }} onClick={handleLogout}>登出</button>
      </header>

      {/* 在此放回你的主要 App UI */}
      <main style={{ padding: 20 }}>
        {/* ... 你的 Dashboard / TransactionList / 其他元件 ... */}
        <p>歡迎回來！這是 debug 模式下的主畫面。</p>
      </main>
    </div>
  );
};

export default App;
