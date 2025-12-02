import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    showNumber?: boolean;
    size?: number;
    className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, showNumber = false, size = 14, className = '' }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.3 && rating % 1 < 0.8;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center text-yellow-500">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} size={size} fill="currentColor" strokeWidth={0} />
                ))}
                {hasHalfStar && (
                    <div className="relative">
                        <Star size={size} className="text-gray-300" fill="currentColor" strokeWidth={0} />
                        <StarHalf 
                            size={size} 
                            className="absolute top-0 left-0 text-yellow-500" 
                            fill="currentColor" 
                            strokeWidth={0} 
                        />
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} size={size} className="text-gray-300" fill="currentColor" strokeWidth={0} />
                ))}
            </div>
            {showNumber && (
                <span className="text-xs font-semibold text-gray-700 ml-0.5">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
};

export default StarRating;
