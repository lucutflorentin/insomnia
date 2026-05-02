import Image from 'next/image';
import { RenderSlideProps, isImageSlide } from 'yet-another-react-lightbox';

export default function NextJsImage({ slide, rect }: RenderSlideProps) {
  if (!isImageSlide(slide)) return undefined;

  // Calculate dimensions to maintain aspect ratio within the available rect
  const width = !slide.width || !slide.height 
    ? rect.width 
    : Math.min(rect.width, (rect.height / slide.height) * slide.width);
  const height = !slide.width || !slide.height 
    ? rect.height 
    : Math.min(rect.height, (rect.width / slide.width) * slide.height);

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: Math.round(width), 
        height: Math.round(height),
        margin: 'auto' 
      }}
    >
      <Image
        fill
        alt={slide.alt || ''}
        src={slide.src}
        priority
        draggable={false}
        unoptimized // Prevents double compression by Next.js
        style={{ objectFit: 'contain' }}
        sizes={`${Math.ceil((width / (typeof window !== 'undefined' ? window.innerWidth : 1024)) * 100)}vw`}
      />
    </div>
  );
}
