import React from 'react';

export default function SkeletonLoader({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse flex flex-col"
        >
          {/* Image skeleton */}
          <div className="aspect-4/3 bg-slate-200" />

          {/* Details skeleton */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-5 bg-slate-200 rounded-md w-5/6" />
              <div className="h-3.5 bg-slate-200 rounded-md w-full" />
              <div className="h-3.5 bg-slate-200 rounded-md w-2/3" />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="h-6 bg-slate-200 rounded-md w-20" />
              <div className="h-9 bg-slate-200 rounded-xl w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
