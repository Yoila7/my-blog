'use client';

import { useEffect } from 'react';

export default function AuthProvider() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      // 清除 URL 中的 token，然后回到之前浏览的页面或首页
      const returnTo = localStorage.getItem('returnTo') || '/';
      localStorage.removeItem('returnTo');
      window.location.href = returnTo;
    }
  }, []);

  return null;
}
