import React from 'react';
import './Skeleton.css';

export const SkeletonLine = ({ className = '' }) => (
  <div className={`skeleton-line shimmer ${className}`}></div>
);

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-banner shimmer"></div>
    <div className="skeleton-content">
      <div className="skeleton-line shimmer title"></div>
      <div className="skeleton-line shimmer description"></div>
      <div className="skeleton-line shimmer description short"></div>
      <div className="skeleton-footer">
        <div className="skeleton-line shimmer btn"></div>
        <div className="skeleton-line shimmer price"></div>
      </div>
    </div>
  </div>
);

export const SkeletonCircle = ({ size = '40px' }) => (
  <div 
    className="skeleton-circle shimmer" 
    style={{ width: size, height: size }}
  ></div>
);
