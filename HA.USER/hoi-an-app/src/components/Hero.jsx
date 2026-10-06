// src/components/Hero.jsx
import React from 'react';
import heroImg from '../assets/POI/hero.jpg';

export default function Hero({ onOpenMap }) {
  return (
    <section className="hero hero--editorial">
      <div
        className="hero__editorial-bg"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden="true"
      />

      <div className="hero__editorial-overlay" aria-hidden="true" />

      <div className="hero__editorial-content">
        <p className="hero__editorial-eyebrow">HỘI AN · DI SẢN</p>

        <h1 className="hero__editorial-title">
          <span>ĐÁNH THỨC</span>
          <span>HỒN PHỐ CỔ</span>
        </h1>

        {/* Nút CTA mở bản đồ */}
        <button
          type="button"
          className="hero__cta"
          onClick={onOpenMap}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>KHÁM PHÁ BẢN ĐỒ</span>
        </button>
      </div>
    </section>
  );
}