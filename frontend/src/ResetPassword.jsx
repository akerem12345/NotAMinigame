import React, { useState, useEffect } from 'react';
import './index.css';
import { apiFetch } from './api';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
        setStatusMsg("Hata: Token bulunamadı. Lütfen e-postanızdaki bağlantıyı kullanın.");
        return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg("Şifreler eşleşmiyor! (Passwords do not match)");
      return;
    }
    
    setStatusMsg("Şifre güncelleniyor...");
    try {
        const res = await apiFetch('/users/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword })
        });
        setStatusMsg(res.message || "Şifreniz başarıyla yenilendi! Giriş yapabilirsiniz.");
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } catch(err) {
        setStatusMsg("Hata: " + err.message);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-content" style={{ margin: 'auto' }}>
        <h2>Reset Password</h2>
        <p className="tagline" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1rem' }}>
          Lütfen yeni şifrenizi girin.
        </p>

        {statusMsg && <div style={{color: '#bc13fe', marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem'}}>{statusMsg}</div>}

        {!token && (
            <div style={{color: 'red', textAlign: 'center', marginBottom: '15px'}}>Geçersiz veya eksik token. Lütfen mailinizdeki bağlantıya tıklayın.</div>
        )}

        {token && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group password-group">
            <label>Yeni Şifre</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Yeni şifrenizi giriniz" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="input-group password-group">
            <label>Yeni Şifre (Tekrar)</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Yeni şifrenizi tekrar giriniz" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="submit-btn" type="submit" style={{ marginTop: '2rem' }}>
            Şifreyi Güncelle
          </button>
        </form>
        )}

        <p className="auth-switch" style={{ marginTop: '2rem' }}>
          <span onClick={() => window.location.href = '/'}>
            ← Ana Sayfaya Dön (Back to Home)
          </span>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
