import React from 'react';
import { IconStar } from '../lib/svgIcons';

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
                    <IconStar key={`full-${i}`} size={size} filled className="text-yellow-500" />
                ))}
                {hasHalfStar && (
                    <div className="relative">
                        <IconStar size={size} className="text-gray-300" />
                        <div 
                            className="absolute top-0 left-0 overflow-hidden w-1/2" 
                            style={{width: `${size/2}px`}}
                        >
                            <IconStar size={size} className="text-yellow-500" />
                        </div>
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <IconStar key={`empty-${i}`} size={size} className="text-gray-300" />
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
