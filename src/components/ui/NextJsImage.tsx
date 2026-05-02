import Image from 'next/image';
import { RenderSlideProps, isImageSlide } from 'yet-another-react-lightbox';

export default function NextJsImage({ slide, rect }: RenderSlideProps) {
  if (!isImageSlide(slide)) return undefined;

  // Safe dimension calculation that defaults to 100% during SSR/hydration
  const width = !slide.width || !slide.height 
    ? rect.width 
    : Math.min(rect.width, (rect.height / slide.height) * slide.width);
    
  const height = !slide.width || !slide.height 
    ? rect.height 
    : Math.min(rect.height, (rect.width / slide.width) * slide.height);

  const containerWidth = width > 0 ? Math.round(width) : '100%';
  const containerHeight = height > 0 ? Math.round(height) : '100%';

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: containerWidth, 
        height: containerHeight,
        margin: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Image
        fill
        alt={slide.alt || ''}
        src={slide.src}
        quality={100}
        priority
        draggable={false}
        style={{ objectFit: 'contain' }}
        sizes="100vw"
      />
    </div>
  );
}
