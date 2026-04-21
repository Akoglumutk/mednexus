// app/api/hastane/consult/route.ts
import { NextResponse } from 'next/server';

// KRİTİK: Fonksiyonun başında mutlaka "export" olmalı!
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Konsültasyon mantığı buraya gelecek
    // Şimdilik boş bir yanıt dönelim ki build geçsin
    return NextResponse.json({ 
      message: "Konsültasyon talebi alındı.",
      status: "success" 
    });
    
  } catch (error) {
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}

// Eğer GET isteği de atacaksan:
export async function GET() {
  return NextResponse.json({ message: "Consult API aktif." });
}