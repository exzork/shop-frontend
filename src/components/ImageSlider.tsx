import React, { useState, useEffect, useCallback } from 'react';
import { Image } from './Image';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface ImageSliderProps {
    images: string[];
    onClick?: (url: string) => void;
    className?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({ images, onClick, className = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    }, [images.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    }, [images.length]);

    useEffect(() => {
        if (images.length <= 1 || isHovered) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 3000);

        return () => clearInterval(interval);
    }, [images.length, isHovered, nextSlide]);

    if (!images || images.length === 0) {
        return <div className={`bg-gray-200 dark:bg-gray-600 ${className}`} />;
    }

    return (
        <div 
            className={`relative group overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Images */}
            <div 
                className="w-full h-full flex transition-transform duration-500 ease-out cursor-pointer"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                onClick={() => onClick?.(images[currentIndex])}
            >
                {images.map((url, index) => (
                    <div key={index} className="w-full h-full flex-shrink-0">
                        <Image 
                            src={url} 
                            alt={`Slide ${index}`} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            prevSlide();
                        }}
                    >
                        <IoIosArrowBack size={20} />
                    </button>
                    <button
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                        }}
                    >
                        <IoIosArrowForward size={20} />
                    </button>
                </>
            )}

            {/* Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                index === currentIndex ? 'bg-white w-3' : 'bg-white/50'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(index);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
