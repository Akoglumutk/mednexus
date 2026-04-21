'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // client helper'ını oluşturduğunu varsayıyoruz

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Erişim Reddedildi: " + error.message)
    else window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-serif">
      <div className="p-8 border-2 border-[#D4AF37] bg-black/50 shadow-[0_0_20px_rgba(212,175,55,0.2)] max-w-sm w-full">
        <h1 className="text-[#D4AF37] text-3xl mb-6 text-center tracking-widest uppercase">MedNexus</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="email" 
            placeholder="Kullanıcı"
            className="w-full bg-black border-b border-[#D4AF37] text-white p-2 focus:outline-none focus:border-red-800 transition-colors"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Anahtar"
            className="w-full bg-black border-b border-[#D4AF37] text-white p-2 focus:outline-none focus:border-red-800 transition-colors"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-[#D4AF37] text-black font-bold py-2 hover:bg-[#B8962E] transition-all">
            KAPIYI AÇ
          </button>
        </form>
      </div>
    </div>
  )
}