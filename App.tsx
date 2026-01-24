import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import Dashboard from './components/Dashboard'; // 確認路徑與檔名
// 如有其他全域元件可在此 import，例如 Header, Footer

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log('onAuthStateChanged', u);
      setUser(u);
      setLoadingAuth(false);
    }, (err) => {
      console.error('Auth error', err);
      setAuthError(err);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('signOut error', err);
    }
  };

  if (loadingAuth) return <div style={{padding:20}}>Loading...</div>;
  if (authError) return <div style={{color:'red', padding:20}}>Auth error: {String(authError)}</div>;

  return (
    <div className="app-root">
      <header style={{padding:12, borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>已登入：{user?.displayName ?? user?.email ?? user?.uid}</div>
        <div><button onClick={handleLogout}>登出</button></div>
      </header>

      <main style={{padding:16}}>
        {/* 把真正的主畫面放在 Dashboard 裡 */}
        <Dashboard user={user} />
      </main>
    </div>
  );
};

export default App;
